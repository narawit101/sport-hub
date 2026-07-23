const pool = require("../config/db");
const { getCache, setCache, invalidatePattern } = require("../config/cache");
const { FIELD_STATUS, USER_ROLE } = require("../utils/constants");

/**
 * VenueAggregateService Module
 * Deep Domain Aggregate for Sports Venues, Sub-fields, Add-ons, and Facilities.
 * Encapsulates multi-entity invariants, transaction bounds, and aggregated availability.
 */
class VenueAggregateService {
  /**
   * Fetch complete aggregate model for a Venue (Field + SubFields + AddOns + Facilities).
   */
  async getVenueAggregate(fieldId, currentUser) {
    const cacheKey = `venue:aggregate:${fieldId}`;
    const cached = await getCache(cacheKey);
    if (cached && (!currentUser || currentUser.role !== USER_ROLE.ADMIN)) {
      return cached;
    }

    const fieldRes = await pool.query(
      `SELECT f.*, u.first_name, u.last_name, u.email, u.user_profile
       FROM field f
       JOIN users u ON f.user_id = u.user_id
       WHERE f.field_id = $1`,
      [fieldId]
    );

    if (fieldRes.rowCount === 0) {
      throw new Error("ไม่พบข้อมูลสนาม");
    }

    const field = fieldRes.rows[0];

    // Authorization check if field is pending/rejected
    if (
      field.status !== FIELD_STATUS.VERIFIED &&
      (!currentUser || (currentUser.user_id !== field.user_id && currentUser.role !== USER_ROLE.ADMIN))
    ) {
      throw new Error("ไม่มีสิทธิ์เข้าถึงข้อมูลสนามนี้");
    }

    const [subFieldsRes, facilitiesRes, reviewsRes] = await Promise.all([
      pool.query(
        `SELECT sf.*, st.sport_name,
                (SELECT COALESCE(json_agg(jsonb_build_object(
                   'add_on_id', a.add_on_id,
                   'content', a.content,
                   'price', a.price
                 )), '[]')
                 FROM add_on a WHERE a.sub_field_id = sf.sub_field_id) AS add_ons
         FROM sub_field sf
         LEFT JOIN sports_types st ON sf.sport_id = st.sport_id
         WHERE sf.field_id = $1
         ORDER BY sf.sub_field_id ASC`,
        [fieldId]
      ),
      pool.query(
        `SELECT field_fac_id, field_id, fac_name, fac_price, quantity_total, description, image_path
         FROM field_facilities
         WHERE field_id = $1
         ORDER BY field_fac_id ASC`,
        [fieldId]
      ),
      pool.query(
        `SELECT r.*, u.first_name, u.last_name, u.user_profile
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.field_id = $1
         ORDER BY r.created_at DESC LIMIT 10`,
        [fieldId]
      ),
    ]);

    const aggregate = {
      ...field,
      subFields: subFieldsRes.rows,
      facilities: facilitiesRes.rows,
      reviews: reviewsRes.rows,
    };

    await setCache(cacheKey, aggregate, 300); // 5 minutes TTL
    return aggregate;
  }

  /**
   * Validate business invariants for a venue configuration.
   */
  validateVenueInvariants(data) {
    const { field_name, open_hours, close_hours, cancel_hours } = data;

    if (field_name && field_name.trim() === "") {
      throw new Error("ชื่อสนามห้ามเป็นค่าว่าง");
    }

    if (cancel_hours !== undefined && (isNaN(Number(cancel_hours)) || Number(cancel_hours) < 0)) {
      throw new Error("จำนวนชั่วโมงการยกเลิกต้องเป็นตัวเลขที่ไม่ติดลบ");
    }
  }

  /**
   * Update Venue Configuration (Field properties, SubFields, Facilities) in an atomic transaction.
   */
  async updateVenueConfig(fieldId, payload, currentUser) {
    this.validateVenueInvariants(payload);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const checkRes = await client.query(
        `SELECT user_id FROM field WHERE field_id = $1 FOR UPDATE`,
        [fieldId]
      );

      if (checkRes.rowCount === 0) throw new Error("ไม่พบสนาม");
      if (checkRes.rows[0].user_id !== currentUser.user_id && currentUser.role !== USER_ROLE.ADMIN) {
        throw new Error("Unauthorized");
      }

      const {
        field_name, address, gps_location, open_hours, close_hours,
        number_bank, account_holder, price_deposit, name_bank,
        open_days, field_description, cancel_hours, slot_duration,
      } = payload;

      const updateRes = await client.query(
        `UPDATE field SET
           field_name = COALESCE($1, field_name),
           address = COALESCE($2, address),
           gps_location = COALESCE($3, gps_location),
           open_hours = COALESCE($4, open_hours),
           close_hours = COALESCE($5, close_hours),
           number_bank = COALESCE($6, number_bank),
           account_holder = COALESCE($7, account_holder),
           price_deposit = COALESCE($8, price_deposit),
           name_bank = COALESCE($9, name_bank),
           open_days = COALESCE($10, open_days),
           field_description = COALESCE($11, field_description),
           cancel_hours = COALESCE($12, cancel_hours),
           slot_duration = COALESCE($13, slot_duration)
         WHERE field_id = $14 RETURNING *`,
        [
          field_name, address, gps_location, open_hours, close_hours,
          number_bank, account_holder, price_deposit, name_bank,
          open_days, field_description, cancel_hours, slot_duration,
          fieldId,
        ]
      );

      await client.query("COMMIT");
      await invalidatePattern(`venue:aggregate:${fieldId}`);
      await invalidatePattern(`field:${fieldId}:*`);

      return updateRes.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get Real-Time Aggregate Availability for Venue Courts and Facilities on a specific date.
   */
  async getVenueAvailability(fieldId, dateStr) {
    const cacheKey = `venue:availability:${fieldId}:${dateStr}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [subFieldsRes, facilitiesRes] = await Promise.all([
      pool.query(
        `SELECT sf.sub_field_id, sf.sub_field_name, sf.price, st.sport_name,
                (SELECT json_agg(b.*) FROM bookings b
                 WHERE b.sub_field_id = sf.sub_field_id
                   AND COALESCE(b.start_date, b.booking_date) = $2
                   AND b.status NOT IN ('rejected', 'cancelled')) AS bookings
         FROM sub_field sf
         LEFT JOIN sports_types st ON sf.sport_id = st.sport_id
         WHERE sf.field_id = $1`,
        [fieldId, dateStr]
      ),
      pool.query(
        `SELECT ff.field_fac_id, ff.fac_name, ff.fac_price, ff.quantity_total,
                COALESCE(SUM(bf.quantity), 0) AS booked_quantity
         FROM field_facilities ff
         LEFT JOIN booking_fac bf ON bf.field_fac_id = ff.field_fac_id
         LEFT JOIN bookings b ON bf.booking_id = b.booking_id AND COALESCE(b.start_date, b.booking_date) = $2 AND b.status NOT IN ('rejected', 'cancelled')
         WHERE ff.field_id = $1
         GROUP BY ff.field_fac_id`,
        [fieldId, dateStr]
      ),
    ]);

    const availability = {
      subFields: subFieldsRes.rows.map((sf) => ({
        ...sf,
        bookings: sf.bookings || [],
      })),
      facilities: facilitiesRes.rows.map((f) => ({
        ...f,
        available: Math.max(0, Number(f.quantity_total) - Number(f.booked_quantity)),
      })),
    };

    await setCache(cacheKey, availability, 120); // 2 minutes TTL
    return availability;
  }
}

module.exports = new VenueAggregateService();
