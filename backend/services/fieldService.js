const pool = require("../config/db");
const { invalidateCache, invalidatePattern } = require("../config/cache");
const { deleteCloudinaryFile, deleteMultipleCloudinaryFiles } = require("../utils/delete");
const { sendEmail } = require("../utils/email");
const { FIELD_STATUS, USER_ROLE, BOOKING_STATUS } = require("../utils/constants");
const {
  fieldRegistered,
  fieldRegisteredNotifyAdmin,
  fieldAppealNotifyAdmin,
  fieldEditNotifyAdmin,
  fieldApproved,
  fieldRejected
} = require("../utils/emailTemplates");

class FieldService {
  async registerField(data, files, io) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        user_id, field_name, address, gps_location, open_hours, close_hours,
        number_bank, account_holder, price_deposit, name_bank, status,
        selectedFacilities = {}, subFields = [], open_days, field_description,
        cancel_hours, slot_duration
      } = data;

      const docFiles = files.filter((f) => f.fieldname === "documents");
      if (docFiles.length === 0) throw new Error("กรุณาอัปโหลดเอกสาร");
      const documents = docFiles.map((f) => f.path.replace(/\\/g, "/")).join(", ");

      const imgFieldFile = files.find((f) => f.fieldname === "img_field");
      const imgField = imgFieldFile ? imgFieldFile.path : null;

      const fieldResult = await client.query(
        `INSERT INTO field (user_id, field_name, address, gps_location, open_hours, close_hours,
                            number_bank, account_holder, price_deposit, name_bank, documents,
                            img_field, status, open_days, field_description, cancel_hours, slot_duration)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING field_id`,
        [user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit || 0, name_bank, documents, imgField, status || FIELD_STATUS.PENDING, open_days, field_description, cancel_hours || 0, slot_duration]
        );

      const field_id = fieldResult.rows[0].field_id;

      for (const sub of subFields) {
        const subRes = await client.query(
          `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, user_id, 
                                  wid_field, length_field, players_per_team, field_surface)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING sub_field_id`,
          [field_id, sub.name, sub.price || 0, sub.sport_id, user_id, sub.wid_field || 0, sub.length_field || 0, sub.players_per_team || 0, sub.field_surface || ""]
        );
        const sub_field_id = subRes.rows[0].sub_field_id;

        for (const addon of sub.addOns || []) {
          await client.query(
            `INSERT INTO add_on (sub_field_id, content, price) VALUES ($1,$2,$3)`,
            [sub_field_id, addon.content, addon.price || 0]
          );
        }
      }

      for (const facId of Object.keys(selectedFacilities)) {
        const fac = selectedFacilities[facId] || {};
        const facPrice = parseFloat(fac.price) || 0;
        const quantity_total = parseInt(fac.quantity_total ?? fac.quantity ?? 0, 10) || 0;
        const description = fac.description ? fac.description.toString().slice(0, 300) : null;
        const safeKey = fac._key;

        const facImgFile = files.find(f => (safeKey && f.fieldname === `facility_image_${safeKey}`) || f.fieldname === `facility_image_${facId}`);
        const image_path = facImgFile ? facImgFile.path : null;

        await client.query(
          `INSERT INTO field_facilities (field_id, fac_name, fac_price, quantity_total, description, image_path)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [field_id, facId, facPrice, quantity_total, description, image_path]
        );
      }

      const userRes = await client.query("SELECT email, first_name FROM users WHERE user_id = $1", [user_id]);
      const user = userRes.rows[0];

      await client.query("COMMIT");


      if (user?.email) {
          sendEmail({ to: user.email, subject: "การลงทะเบียนสนาม", html: fieldRegistered() }).catch(e => console.error(e));
      }

      const admins = await pool.query(`SELECT user_id, email FROM users WHERE role = '${USER_ROLE.ADMIN}'`);
      for (const admin of admins.rows) {
          if (admin.email) {
              sendEmail({
                  to: admin.email,
                  subject: "มีการลงทะเบียนสนามกีฬาใหม่",
                  html: fieldRegisteredNotifyAdmin({ userName: user.first_name, fieldId: field_id }),
              }).catch(e => console.error(e));
          }
          await pool.query(
            `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
             VALUES ($1,$2,$3,$4,$5,'unread')`,
            [user_id, admin.user_id, "field_registered", "มีการลงทะเบียนสนามใหม่", field_id]
          );
          if (io) {
            io.to(admin.user_id.toString()).emit("new_notification", { topic: "field_registered", reciveId: admin.user_id, keyId: field_id });
          }
      }

      return { field_id, facilitiesCount: Object.keys(selectedFacilities).length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async appealField(fieldId, status, currentUser, io) {
    const checkField = await pool.query("SELECT * FROM field WHERE field_id = $1", [fieldId]);
    if (checkField.rows.length === 0) throw new Error("ไม่พบข้อมูลสนามกีฬา");
    const field = checkField.rows[0];

    if (currentUser.role !== USER_ROLE.ADMIN && currentUser.user_id !== field.user_id) {
      throw new Error("Unauthorized");
    }

    const result = await pool.query(
      `UPDATE field SET status = $1 WHERE field_id = $2 RETURNING *`,
      [status, fieldId]
    );

    await invalidateCache(`field_profile:${fieldId}`);

    const admins = await pool.query(`SELECT user_id, email FROM users WHERE role = '${USER_ROLE.ADMIN}'`);
    for (const admin of admins.rows) {
        if (admin.email) {
            sendEmail({
                to: admin.email,
                subject: "มีการส่งลงทะเบียนสนามกีฬาอีกครั้ง",
                html: fieldAppealNotifyAdmin({ fieldName: field.field_name, fieldId }) + fieldEditNotifyAdmin({ fieldName: field.field_name, fieldId }),
            }).catch(e => console.error(e));
        }
        await pool.query(
            `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
             VALUES ($1,$2,$3,$4,$5,'unread')`,
            [currentUser.user_id, admin.user_id, "field_appeal", "ได้ส่งคำขอลงทะเบียนสนามกีฬาอีกครั้ง", fieldId]
        );
        if (io) {
            io.to(admin.user_id.toString()).emit("new_notification", { topic: "field_appeal", reciveId: admin.user_id, keyId: fieldId });
        }
    }

    return result.rows[0];
  }

  async getFieldById(fieldId, currentUser) {
    const isAdmin = currentUser.role === USER_ROLE.ADMIN;
    const query = `
      SELECT 
        f.*, u.user_id, u.first_name, u.last_name, u.email,
        COALESCE(json_agg(
          DISTINCT jsonb_build_object(
            'sub_field_id', s.sub_field_id,
            'sub_field_name', s.sub_field_name,
            'players_per_team', s.players_per_team,
            'wid_field', s.wid_field,
            'length_field', s.length_field,
            'field_surface', s.field_surface,
            'price', s.price,
            'sport_name', sp.sport_name,
            'add_ons', (
              SELECT COALESCE(json_agg(jsonb_build_object(
                'add_on_id', a.add_on_id,
                'content', a.content,
                'price', a.price
              )), '[]'::json) 
              FROM add_on a 
              WHERE a.sub_field_id = s.sub_field_id
            )
          )
        ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
      FROM field f
      INNER JOIN users u ON f.user_id = u.user_id
      LEFT JOIN sub_field s ON f.field_id = s.field_id
      LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
      WHERE f.field_id = $1 ${isAdmin ? "" : "AND f.user_id = $2"}
      GROUP BY f.field_id, u.user_id;
    `;
    const values = isAdmin ? [fieldId] : [fieldId, currentUser.user_id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) throw new Error(isAdmin ? "ไม่พบข้อมูลสนามกีฬา" : "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
    return result.rows[0];
  }

  async updateFieldStatus(fieldId, { status, reasoning }, io, currentUser) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE field SET status = $1, reasoning = $2 WHERE field_id = $3 RETURNING *`,
        [status, reasoning, fieldId]
      );
      if (result.rowCount === 0) throw new Error("Field not found");
      const field = result.rows[0];

      const userRes = await client.query(`SELECT email, first_name FROM users WHERE user_id = $1`, [field.user_id]);
      const user = userRes.rows[0];

      if (status === FIELD_STATUS.VERIFIED) {
          const userRole = user.role;
          if (userRole === USER_ROLE.CUSTOMER) {
              await client.query(`UPDATE users SET role = '${USER_ROLE.FIELD_OWNER}' WHERE user_id = $1`, [field.user_id]);
          }
      }

      await pool.query(
        `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
         VALUES ($1,$2,$3,$4,$5,'unread')`,
        [currentUser?.user_id || null, field.user_id, `field_${status === FIELD_STATUS.VERIFIED ? "approved" : "rejected"}`, reasoning || "อัปเดตสถานะสนาม", fieldId]
      );

      await client.query("COMMIT");

      if (io) {
        io.to(field.user_id.toString()).emit("new_notification", {
          topic: `field_${status === FIELD_STATUS.VERIFIED ? "approved" : "rejected"}`,
          reciveId: field.user_id,
          keyId: fieldId
        });
        io.to(field.user_id.toString()).emit("updated_status", { userId: field.user_id });
      }

      if (user?.email) {
          const html = status === FIELD_STATUS.VERIFIED ? fieldApproved({ fieldName: field.field_name }) : fieldRejected({ fieldName: field.field_name, reasoning });
          sendEmail({ to: user.email, subject: `ผลการตรวจสอบสนามกีฬา ${field.field_name}`, html }).catch(e => console.error(e));
      }

      await invalidateCache(`field_profile:${fieldId}`);
      await invalidateCache(`user:profile:${field.user_id}`, "users:all");
      await invalidatePattern(`statistics:field:${fieldId}:*`);
      await invalidatePattern("search:*");
      return field;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteField(fieldId, currentUser, io) {
      const client = await pool.connect();
      try {
          await client.query("BEGIN");
          const fieldRes = await client.query(`SELECT user_id, img_field, documents FROM field WHERE field_id = $1`, [fieldId]);
          if (fieldRes.rowCount === 0) throw new Error("Field not found");
          const field = fieldRes.rows[0];

          if (currentUser.role !== USER_ROLE.ADMIN && currentUser.user_id !== field.user_id) throw new Error("Unauthorized");

          const checkBooking = await client.query(`SELECT booking_id FROM bookings WHERE field_id = $1 AND status IN ('${BOOKING_STATUS.APPROVED}', '${BOOKING_STATUS.VERIFIED}')`, [fieldId]);
          if (checkBooking.rows.length > 0 && currentUser.role !== USER_ROLE.ADMIN) {
              throw new Error("ไม่สามารถลบสนามได้เนื่องจากมีการจองสนามอยู่ กรุณาติดต่อผู้ดูแลระบบ");
          }

          const subFields = await client.query("SELECT sub_field_id FROM sub_field WHERE field_id = $1", [fieldId]);
          for (const sub of subFields.rows) {
              await client.query("DELETE FROM add_on WHERE sub_field_id = $1", [sub.sub_field_id]);
          }
          await client.query("DELETE FROM sub_field WHERE field_id = $1", [fieldId]);

          const postImages = await client.query(`SELECT image_url FROM post_images WHERE post_id IN (SELECT post_id FROM posts WHERE field_id = $1)`, [fieldId]);
          await deleteMultipleCloudinaryFiles(postImages.rows.map(img => img.image_url));
          await client.query(`DELETE FROM post_images WHERE post_id IN (SELECT post_id FROM posts WHERE field_id = $1)`, [fieldId]);
          await client.query("DELETE FROM posts WHERE field_id = $1", [fieldId]);

          if (field.img_field) await deleteCloudinaryFile(field.img_field);
          
          const facImages = await client.query("SELECT image_path FROM field_facilities WHERE field_id = $1", [fieldId]);
          await deleteMultipleCloudinaryFiles(facImages.rows.map(row => row.image_path).filter(Boolean));
          
          await client.query("DELETE FROM booking_fac WHERE field_fac_id IN (SELECT field_fac_id FROM field_facilities WHERE field_id = $1)", [fieldId]);
          await client.query("DELETE FROM field_facilities WHERE field_id = $1", [fieldId]);

          if (field.documents) {
              const docPaths = typeof field.documents === 'string' ? field.documents.split(',').map(s => s.trim()) : field.documents;
              await deleteMultipleCloudinaryFiles(docPaths);
          }

          await client.query("DELETE FROM field WHERE field_id = $1", [fieldId]);

          const remainingFields = await client.query("SELECT field_id FROM field WHERE user_id = $1", [field.user_id]);
          if (remainingFields.rowCount === 0) {
              await client.query(`UPDATE users SET role = '${USER_ROLE.CUSTOMER}' WHERE user_id = $1`, [field.user_id]);
          }

          await client.query("COMMIT");
          if (io) io.emit("updated_status", { userId: field.user_id });

          await invalidateCache(`field_profile:${fieldId}`, `facilities:field:${fieldId}`, `posts:field:${fieldId}`);
          await invalidatePattern(`statistics:field:${fieldId}:*`);
          await invalidatePattern("search:*");

          return { success: true };
      } catch (error) {
          await client.query("ROLLBACK");
          throw error;
      } finally {
          client.release();
      }
  }

  async updateField(fieldId, updateData, currentUser) {
      const checkField = await pool.query("SELECT user_id FROM field WHERE field_id = $1", [fieldId]);
      if (checkField.rowCount === 0) throw new Error("Field not found");
      const field = checkField.rows[0];

      if (currentUser.role !== USER_ROLE.ADMIN && currentUser.user_id !== field.user_id) throw new Error("Unauthorized");

      const query = `
        UPDATE field 
        SET field_name = COALESCE($1, field_name), 
            address = COALESCE($2, address), 
            gps_location = COALESCE($3, gps_location),
            open_hours = COALESCE($4, open_hours), 
            close_hours = COALESCE($5, close_hours),
            price_deposit = COALESCE($6, price_deposit), 
            name_bank = COALESCE($7, name_bank),
            account_holder = COALESCE($8, account_holder), 
            number_bank = COALESCE($9, number_bank),
            img_field = COALESCE($10, img_field),
            documents = COALESCE($11, documents),
            field_description = COALESCE($12, field_description),
            cancel_hours = COALESCE($13, cancel_hours),
            open_days = COALESCE($14, open_days),
            slot_duration = COALESCE($15, slot_duration)
        WHERE field_id = $16 RETURNING *
      `;
      const values = [
          updateData.field_name, updateData.address, updateData.gps_location,
          updateData.open_hours, updateData.close_hours, updateData.price_deposit,
          updateData.name_bank, updateData.account_holder, updateData.number_bank,
          updateData.img_field, updateData.documents, updateData.field_description,
          updateData.cancel_hours, updateData.open_days, updateData.slot_duration,
          fieldId
      ];

      const result = await pool.query(query, values);
      await invalidateCache(`field_profile:${fieldId}`);
      await invalidatePattern(`statistics:field:${fieldId}:*`);
      await invalidatePattern("search:*");
      return result.rows[0];
  }

  async uploadFieldImage(fieldId, filePath) {
    const oldImg = await pool.query("SELECT img_field FROM field WHERE field_id = $1", [fieldId]);
    const oldPath = oldImg.rows[0]?.img_field;
    if (oldPath) await deleteCloudinaryFile(oldPath);
    await pool.query(`UPDATE field SET img_field = $1 WHERE field_id = $2`, [filePath, fieldId]);
    return filePath;
  }

  async uploadFieldDocuments(fieldId, newFilePaths) {
    const currentDocs = await pool.query("SELECT documents FROM field WHERE field_id = $1", [fieldId]);
    let allDocuments = [];
    if (currentDocs.rows[0]?.documents) {
      allDocuments = currentDocs.rows[0].documents.split(",").map(path => path.trim()).filter(Boolean);
    }

    if (allDocuments.length + newFilePaths.length > 10) {
      // Clean up uploaded files in Cloudinary
      for (const p of newFilePaths) {
        try {
          await deleteCloudinaryFile(p);
        } catch (err) {
          console.warn("Clean up file error:", err.message);
        }
      }
      throw new Error(`ไม่สามารถอัปโหลดไฟล์เพิ่มได้ เนื่องจากจะเกินขีดจำกัดสูงสุด 10 ไฟล์ (ปัจจุบันมี ${allDocuments.length} ไฟล์, ต้องการเพิ่มอีก ${newFilePaths.length} ไฟล์)`);
    }

    allDocuments = [...allDocuments, ...newFilePaths];
    await pool.query(`UPDATE field SET documents = $1 WHERE field_id = $2`, [allDocuments.join(", "), fieldId]);
    return { newFilePaths, allDocuments };
  }

  async deleteFieldDocument(fieldId, documentUrl) {
    const currentDocs = await pool.query("SELECT documents FROM field WHERE field_id = $1", [fieldId]);
    if (!currentDocs.rows[0]?.documents) throw new Error("ไม่พบเอกสารในระบบ");
    const documentsList = currentDocs.rows[0].documents.split(",").map(doc => doc.trim()).filter(Boolean);
    const updatedDocuments = documentsList.filter(doc => doc !== documentUrl.trim());
    try {
      await deleteCloudinaryFile(documentUrl);
    } catch (e) {
      console.warn("Cloudinary delete error:", e.message);
    }
    await pool.query("UPDATE field SET documents = $1 WHERE field_id = $2", [updatedDocuments.join(", "), fieldId]);
    return updatedDocuments;
  }

  async replaceSingleDocument(fieldId, documentIndex, oldDocumentUrl, newFilePath) {
    const currentDocs = await pool.query("SELECT documents FROM field WHERE field_id = $1", [fieldId]);
    if (!currentDocs.rows[0]?.documents) throw new Error("ไม่พบเอกสารในระบบ");
    const documentsList = currentDocs.rows[0].documents.split(",").map(doc => doc.trim()).filter(Boolean);
    const index = parseInt(documentIndex);
    if (index < 0 || index >= documentsList.length) throw new Error("ตำแหน่งเอกสารไม่ถูกต้อง");
    try {
      await deleteCloudinaryFile(oldDocumentUrl);
    } catch (e) {
      console.warn("Cloudinary delete error:", e.message);
    }
    documentsList[index] = newFilePath;
    await pool.query("UPDATE field SET documents = $1 WHERE field_id = $2", [documentsList.join(", "), fieldId]);
    return { newFilePath, allDocuments: documentsList };
  }

  async addSubField(fieldId, data) {
    const { sub_field_name, price, sport_id, players_per_team, wid_field, length_field, field_surface, user_id } = data;
    if (!sport_id || isNaN(sport_id)) throw new Error("กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม");
    const result = await pool.query(
      `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, players_per_team, wid_field, length_field, field_surface, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [field_id, sub_field_name, price, sport_id, players_per_team, wid_field, length_field, field_surface, user_id]
    );
    await invalidateCache(`field_profile:${fieldId}`);
    await invalidatePattern(`statistics:field:${fieldId}:*`);
    await invalidatePattern("search:*");
    return result.rows[0];
  }

  async addAddOn(data) {
    const { sub_field_id, content, price } = data;
    const result = await pool.query(`INSERT INTO add_on (sub_field_id, content, price) VALUES ($1, $2, $3) RETURNING *`, [sub_field_id, content, price]);
    const subField = await pool.query("SELECT field_id FROM sub_field WHERE sub_field_id = $1", [sub_field_id]);
    const field_id = subField.rows[0]?.field_id;
    if (field_id) {
      await invalidateCache(`field_profile:${field_id}`);
      await invalidatePattern(`statistics:field:${field_id}:*`);
      await invalidatePattern("search:*");
    }
    return result.rows[0];
  }

  async deleteAddOn(addOnId) {
    const check = await pool.query(
      "SELECT a.*, s.field_id FROM add_on a JOIN sub_field s ON a.sub_field_id = s.sub_field_id WHERE a.add_on_id = $1",
      [addOnId]
    );
    if (check.rowCount === 0) throw new Error("ไม่พบ Add-on ที่ต้องการลบ");
    const field_id = check.rows[0]?.field_id;
    await pool.query("DELETE FROM add_on WHERE add_on_id = $1", [addOnId]);
    if (field_id) {
      await invalidateCache(`field_profile:${field_id}`);
      await invalidatePattern(`statistics:field:${field_id}:*`);
      await invalidatePattern("search:*");
    }
  }

  async updateSubField(subFieldId, data) {
    const { sub_field_name, price, sport_id, players_per_team, wid_field, length_field, field_surface } = data;
    await pool.query(
      `UPDATE sub_field SET sub_field_name = $1, price = $2, sport_id = $3, players_per_team = $4, wid_field = $5, length_field = $6, field_surface = $7 WHERE sub_field_id = $8`,
      [sub_field_name, price, sport_id, players_per_team, wid_field, length_field, field_surface, subFieldId]
    );
    const subField = await pool.query("SELECT field_id FROM sub_field WHERE sub_field_id = $1", [subFieldId]);
    const field_id = subField.rows[0]?.field_id;
    if (field_id) {
      await invalidateCache(`field_profile:${field_id}`);
      await invalidatePattern(`statistics:field:${field_id}:*`);
      await invalidatePattern("search:*");
    }
  }

  async updateAddOn(addOnId, data) {
    const { content, price } = data;
    await pool.query(`UPDATE add_on SET content = $1, price = $2 WHERE add_on_id = $3`, [content, price, addOnId]);
    const addOn = await pool.query("SELECT s.field_id FROM add_on a JOIN sub_field s ON a.sub_field_id = s.sub_field_id WHERE a.add_on_id = $1", [addOnId]);
    const field_id = addOn.rows[0]?.field_id;
    if (field_id) {
      await invalidateCache(`field_profile:${field_id}`);
      await invalidatePattern(`statistics:field:${field_id}:*`);
      await invalidatePattern("search:*");
    }
  }

  async deleteSubField(subFieldId) {
    const subFieldQuery = await pool.query("SELECT * FROM sub_field WHERE sub_field_id = $1", [subFieldId]);
    if (subFieldQuery.rows.length === 0) throw new Error("Subfield not found");
    const field_id = subFieldQuery.rows[0]?.field_id;
    await pool.query("DELETE FROM sub_field WHERE sub_field_id = $1", [subFieldId]);
    if (field_id) {
      await invalidateCache(`field_profile:${field_id}`);
      await invalidatePattern(`statistics:field:${field_id}:*`);
      await invalidatePattern("search:*");
    }
  }

  async saveFacilities(fieldId, selectedFacilities) {
    for (const facId in selectedFacilities) {
      const facPrice = parseFloat(selectedFacilities[facId]) || 0;
      await pool.query(`INSERT INTO field_facilities (field_id, facility_id, fac_price) VALUES ($1, $2, $3)`, [fieldId, facId, facPrice]);
    }
    await invalidateCache(`facilities:field:${fieldId}`);
  }

  async deleteFacility(fieldId, fieldFacId) {
    const q = await pool.query("SELECT image_path FROM field_facilities WHERE field_id = $1 AND field_fac_id = $2", [fieldId, fieldFacId]);
    if (q.rowCount === 0) throw new Error("ไม่พบสิ่งอำนวยความสะดวกนี้ในสนาม");
    const image_path = q.rows[0].image_path;
    if (image_path) await deleteCloudinaryFile(image_path);
    const bookingFacResult = await pool.query("DELETE FROM booking_fac WHERE field_fac_id = $1", [fieldFacId]);
    const result = await pool.query("DELETE FROM field_facilities WHERE field_id = $1 AND field_fac_id = $2", [fieldId, fieldFacId]);
    if (result.rowCount === 0) throw new Error("ไม่พบสิ่งอำนวยความสะดวกนี้ในสนาม");
    await invalidateCache(`facilities:field:${fieldId}`);
    return bookingFacResult.rowCount;
  }

  async getFieldData(subFieldId) {
    const field_id_result = await pool.query(`SELECT field_id FROM sub_field WHERE sub_field_id = $1`, [subFieldId]);
    if (field_id_result.rows.length === 0) throw new Error("Subfield not found");
    const field_id = field_id_result.rows[0].field_id;
    const result = await pool.query(
      `SELECT 
      f.field_id, f.field_name, f.address, f.gps_location, f.documents,
      f.open_hours, f.close_hours, f.img_field, f.name_bank, 
      f.number_bank, f.account_holder, f.status, f.price_deposit, 
      f.open_days, f.field_description,f.slot_duration,
      u.user_id, u.first_name, u.last_name, u.email,
      COALESCE(json_agg(
        DISTINCT jsonb_build_object(
          'sub_field_id', s.sub_field_id,
          'sub_field_name', s.sub_field_name,
          'players_per_team', s.players_per_team,
          'wid_field', s.wid_field,
          'length_field', s.length_field,
          'field_surface', s.field_surface,
          'price', s.price,
          'sport_name', sp.sport_name,
          'add_ons', (
            SELECT COALESCE(json_agg(jsonb_build_object(
              'add_on_id', a.add_on_id,
              'content', a.content,
              'price', a.price
            )), '[]'::json) 
            FROM add_on a 
            WHERE a.sub_field_id = s.sub_field_id
          )
        )
      ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
    FROM field f
    INNER JOIN users u ON f.user_id = u.user_id
    LEFT JOIN sub_field s ON f.field_id = s.field_id
    LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
    WHERE f.field_id = $1
    GROUP BY f.field_id, u.user_id;`,
      [field_id]
    );
    if (result.rows.length === 0) throw new Error("ไม่พบข้อมูล");
    return result.rows;
  }

  async getFieldFacilities(fieldId) {
    const result = await pool.query(
      `SELECT field_fac_id, field_id, fac_name, fac_price, quantity_total, description, image_path
       FROM field_facilities WHERE field_id = $1 ORDER BY field_fac_id`,
      [fieldId]
    );
    return result.rows;
  }

  async updateFacility(fieldFacId, data, file) {
    const { fac_name, fac_price, quantity_total, description } = data;
    const priceValue = parseFloat(fac_price);
    const quantityValue = parseInt(quantity_total);

    const checkFacility = await pool.query("SELECT image_path, field_id FROM field_facilities WHERE field_fac_id = $1", [fieldFacId]);
    if (checkFacility.rowCount === 0) throw new Error("ไม่พบสิ่งอำนวยความสะดวกนี้");
    const fieldId = checkFacility.rows[0].field_id;
    const oldImagePath = checkFacility.rows[0].image_path;
    let newImagePath = oldImagePath;

    if (file) {
      newImagePath = file.path;
      if (oldImagePath) await deleteCloudinaryFile(oldImagePath);
    }

    const result = await pool.query(
      `UPDATE field_facilities 
       SET fac_name = $1, fac_price = $2, quantity_total = $3, description = $4, image_path = $5
       WHERE field_fac_id = $6 RETURNING *`,
      [fac_name.toString().trim(), priceValue, quantityValue, description?.toString().trim() || "", newImagePath, fieldFacId]
    );

    await invalidateCache(`facilities:field:${fieldId}`);
    return result.rows[0];
  }

  async updateFieldLocation(fieldId, gpsLocation) {
    const result = await pool.query("UPDATE field SET gps_location = $1 WHERE field_id = $2 RETURNING *", [gpsLocation, fieldId]);
    if (result.rowCount === 0) throw new Error("ไม่พบสนามนี้");
    await invalidateCache(`field_profile:${fieldId}`);
    await invalidatePattern(`statistics:field:${fieldId}:*`);
    await invalidatePattern("search:*");
    return result.rows[0];
  }
}

module.exports = new FieldService();
