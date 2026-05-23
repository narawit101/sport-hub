"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { createSocket, logSocketError } from "@/app/lib/socket";
import "@/app/css/my-order.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function Myorder() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({
    bookingDate: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const socketRef = useRef(null);
  const router = useRouter();
  const { fieldId } = useParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldOwnerId, setFieldOwnerId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [bookingIdToDelete, setBookingIdToDelete] = useState(null);

  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user?.role === "customer") router.replace("/");
    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!fieldId) return;
    try {
      const queryParams = new URLSearchParams();
      if (filters.bookingDate)
        queryParams.append("bookingDate", filters.bookingDate);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.status) queryParams.append("status", filters.status);

      const res = await fetch(
        `${API_URL}/booking/my-orders/${fieldId}?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMybooking(data.data);
        setFieldName(data.fieldInfo?.field_name || "");
        setFieldOwnerId(data.fieldInfo?.field_owner_id || null);
        if (data.stats) console.log("Stats:", data.stats);
      } else {
        if (data.fieldInfo) {
          setFieldName(data.fieldInfo.field_name || "");
          setMessage(
            `สนาม ${data.fieldInfo.field_name} ${data.fieldInfo.field_status}`
          );
          setMessageType("error");
          setTimeout(() => {
            router.replace("/my-field");
          }, 2000);
        }
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [fieldId, API_URL, filters, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    socketRef.current = createSocket(API_URL);
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
    });

    socket.on("slot_booked", () => {
      console.log(" slot_booked received");
      fetchData();
    });

    socket.on("connect_error", (err) => {
      logSocketError("ManageFieldOrder", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [API_URL, fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: "", endDate: "", status: "", bookingDate: "" });
    setCurrentPage(1);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (!start_date || !start_time || cancel_hours == null) return "-";

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;
    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);
    if (isNaN(bookingDateTime.getTime())) return "-";

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calculateStats = () => {
    const stats = {
      total: booking.length,
      pending: booking.filter((item) => item.status === "pending").length,
      approved: booking.filter((item) => item.status === "approved").length,
      rejected: booking.filter((item) => item.status === "rejected").length,
      complete: booking.filter((item) => item.status === "complete").length,
      verified: booking.filter((item) => item.status === "verified").length,
      totalRevenue: booking

        .filter((item) => item.status === "complete")
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0),
    };
    return stats;
  };
  const handleDeleteBooking = (bookingId) => {
    if (!bookingId) return;
    setBookingIdToDelete(bookingId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = async () => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/booking/delete/${bookingIdToDelete}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.ok) {
        setMessage("ลบการจองสำเร็จ");
        setMessageType("success");
        setShowDeleteModal(false);
        fetchData();
      } else {
        const data = await res.json();
        setMessage(data.error || "ไม่สามารถลบการจองได้");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      setMessage("ไม่สามารถลบการจองได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const stats = calculateStats();
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const bookingPerPage = 8;

  const filteredBookings = booking.filter((item) => {
    if (!filters.status) return true;
    return item.status === filters.status;
  });

  const indexOfLastBooking = currentPage * bookingPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const getPaginationRange = (current, total) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let j;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (j) {
        if (i - j === 2) {
          rangeWithDots.push(j + 1);
        } else if (i - j > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      j = i;
    }

    return rangeWithDots;
  };

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myorder-container">
        <h1>รายการจองสนาม {fieldName}</h1>

        {!useDateRange && (
          <div className="filters-order">
            <label>
              วันที่จอง:
              {filters.bookingDate && <>{formatDate(filters.bookingDate)}</>}
              <input
                type="date"
                name="bookingDate"
                value={filters.bookingDate}
                onChange={handleFilterChange}
              />
            </label>
            <label>
              สถานะ:
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="complete">การจองสำเร็จ</option>
                <option value="verified">ตรวจสอบสลิปมัดจำแล้ว</option>
              </select>
            </label>
            <div className="btn-group-filter">
              <button onClick={clearFilters} className="clear-filters-btn">
                ล้างตัวกรอง
              </button>
              <button
                className="swip-mode-order"
                type="button"
                onClick={() => {
                  setUseDateRange((prev) => !prev);
                  setFilters((prev) => ({
                    ...prev,
                    bookingDate: useDateRange ? prev.bookingDate : "",
                    startDate: useDateRange ? "" : prev.startDate,
                    endDate: useDateRange ? "" : prev.endDate,
                    status: useDateRange ? "" : prev.status,
                  }));
                }}
              >
                {useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
              </button>
            </div>
            {stats.totalRevenue >= 0 && (
              <div className="revenue-summary">
                <div className="revenue-card">
                  <h3>รายได้รวม (การจองสำเร็จ)</h3>
                  <p className="revenue-amount">
                    {stats.totalRevenue.toLocaleString()} บาท
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {useDateRange && (
          <div className="filters-order">
            <div className="date-range-filter">
              <label>
                วันที่เริ่ม:
                {(filters.startDate || filters.endDate) && (
                  <>{filters.startDate && formatDate(filters.startDate)}</>
                )}
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </label>

              <label>
                ถึงวันที่:
                {(filters.startDate || filters.endDate) && (
                  <>{filters.endDate && formatDate(filters.endDate)}</>
                )}
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  min={filters.startDate}
                />
              </label>
            </div>

            <label>
              สถานะ:
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="complete">การจองสำเร็จ</option>
                <option value="verified">ตรวจสอบสลิปมัดจำแล้ว</option>
              </select>
            </label>

            <div className="btn-group-filter">
              <button onClick={clearFilters} className="clear-filters-btn">
                ล้างตัวกรอง
              </button>
              <button
                className="swip-mode-order"
                type="button"
                onClick={() => {
                  setUseDateRange((prev) => !prev);
                  setFilters((prev) => ({
                    ...prev,
                    bookingDate: useDateRange ? prev.bookingDate : "",
                    startDate: useDateRange ? "" : prev.startDate,
                    endDate: useDateRange ? "" : prev.endDate,
                    status: useDateRange ? "" : prev.status,
                  }));
                }}
              >
                {useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
              </button>
            </div>
            {stats.totalRevenue >= 0 && (
              <div className="revenue-summary">
                <div className="revenue-card">
                  <h3>รายได้รวม (การจองสำเร็จ)</h3>
                  <p className="revenue-amount">
                    {stats.totalRevenue.toLocaleString()} บาท
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {booking.length > 0 && (
          <div className="stats-summary">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-inline">
                  รายการทั้งหมด:{" "}
                  <span className="stat-number">{stats.total}</span>
                </p>
              </div>
              <div className="stat-card pending">
                <p className="stat-inline">
                  รอตรวจสอบ:{" "}
                  <span className="stat-number">{stats.pending}</span>
                </p>
              </div>
              <div className="stat-card approved">
                <p className="stat-inline">
                  อนุมัติแล้ว:{" "}
                  <span className="stat-number">{stats.approved}</span>
                </p>
              </div>
              <div className="stat-card rejected">
                <p className="stat-inline">
                  ไม่อนุมัติ:{" "}
                  <span className="stat-number">{stats.rejected}</span>
                </p>
              </div>
              <div className="stat-card complete">
                <p className="stat-inline">
                  การจองสำเร็จ:{" "}
                  <span className="stat-number">{stats.complete}</span>
                </p>
              </div>
              <div className="stat-card verified">
                <p className="stat-inline">
                  ตรวจสอบสลิปมัดจำแล้ว:{" "}
                  <span className="stat-number">{stats.verified}</span>
                </p>
              </div>
            </div>
          </div>
        )}
        {dataLoading ? (
          <ul className="booking-list skeleton-list" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="booking-card skeleton-card">
                <div className="skel-line w60" />
                <div className="skel-line w40" />
                <div className="skel-box" />
                <div className="skel-line w80" />
                <div className="skel-line w50" />
                <div className="skel-line w70" />
                <div className="skel-line w30" />
                <div className="skel-btn w40" />
              </li>
            ))}
          </ul>
        ) : currentBookings.length > 0 ? (
          <>
            <ul className="booking-list">
              {currentBookings.map((item, index) => (
                <li key={index} className="booking-card">
                  <div className="booking-detail">
                    <p>
                      <strong>ชื่อผู้จอง: </strong>
                      {item.first_name} {item.last_name}
                    </p>
                    <p>
                      <strong>วันที่จอง: </strong>
                      {formatDate(item.start_date)}
                    </p>
                    <p>
                      <strong>สนาม: </strong>
                      {item.field_name}
                    </p>
                    <p>
                      <strong>สนามย่อย: </strong>
                      {item.sub_field_name}
                    </p>
                    <div className="hours-container-my-order">
                      <div className="total-hours-order">
                        <p>
                          <strong> เวลาที่จอง: </strong>
                          {item.start_time.substring(0, 5)} -{" "}
                          {item.end_time.substring(0, 5)} น.
                        </p>
                        <p>
                          <strong> สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                          {item.cancel_hours} ชม.
                        </p>
                        <hr className="divider-order" />
                      </div>
                      <div className="total-date-order">
                        <p>
                          ยกเลิกได้ถึง <strong>วันที่:</strong>{" "}
                          {formatDate(item.start_date)} <br />
                          <strong> ** เวลา:</strong>{" "}
                          {getCancelDeadlineTime(
                            item.start_date,
                            item.start_time,
                            item.cancel_hours
                          )}{" "}
                          น. **
                        </p>
                      </div>
                    </div>
                    <div className="compact-price-box-order">
                      <div className="line-item-order">
                        <span>กิจกรรม:</span>
                        <span>{item.activity}</span>
                      </div>
                      <div className="line-item-order">
                        <span>ราคาสนาม:</span>
                        <span>
                          {item.total_price -
                            item.price_deposit -
                            (item.facilities?.reduce(
                              (sum, f) => sum + f.fac_price,
                              0
                            ) || 0)}{" "}
                          บาท
                        </span>
                      </div>

                      {Array.isArray(item.facilities) &&
                        item.facilities.length > 0 && (
                          <div className="line-item-order">
                            <span>ราคาสิ่งอำนวยความสะดวก:</span>
                            <span>
                              {item.facilities.reduce(
                                (sum, f) => sum + f.fac_price,
                                0
                              )}{" "}
                              บาท
                            </span>
                          </div>
                        )}

                      <hr className="divider-order" />

                      <div className="line-item-order remaining">
                        <span className="total-remaining-order">
                          ยอดคงเหลือ:
                        </span>
                        <span className="total-remaining-order">
                          {item.total_remaining} บาท
                        </span>
                      </div>

                      <div className="line-item-order plus">
                        <span className="total_deposit-order">มัดจำ:</span>
                        <span>{item.price_deposit} บาท</span>
                      </div>

                      <hr className="divider-order" />

                      <div className="line-item-order total">
                        <span>สุทธิ:</span>
                        <span>{item.total_price} บาท</span>
                      </div>
                    </div>
                    <p>
                      <strong>สถานะ:</strong>{" "}
                      <span className={`status-text-detail ${item.status}`}>
                        {item.status === "pending"
                          ? "รอตรวจสอบ"
                          : item.status === "approved"
                          ? "อนุมัติแล้ว"
                          : item.status === "rejected"
                          ? "ไม่อนุมัติ"
                          : item.status === "complete"
                          ? "การจองสำเร็จ"
                          : item.status === "verified"
                          ? "ตรวจสอบสลิปมัดจำแล้ว"
                          : "ไม่ทราบสถานะ"}
                      </span>
                    </p>
                  </div>
                  <button
                    className="detail-button"
                    onClick={() =>
                      window.open(
                        `/booking-detail/${item.booking_id}`,
                        "_blank"
                      )
                    }
                  >
                    <img
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269173/icon-park-outline--doc-detail_rufhhe.png"
                      alt=""
                      width={15}
                      height={15}
                      style={{ marginRight: "5px" }}
                    />
                    ดูรายละเอียด
                  </button>
                  {user?.user_id === fieldOwnerId && (
                    <button
                      className="card-delete-bookinng-btn"
                      title="ลบการจอง"
                      onClick={() => {
                        handleDeleteBooking(item.booking_id);
                      }}
                    >
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                        alt=""
                        width={15}
                        height={15}
                      />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {filteredBookings.length > bookingPerPage && (
              <div className="pagination-container-order">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  «
                </button>

                {getPaginationRange(
                  currentPage,
                  Math.ceil(filteredBookings.length / bookingPerPage)
                ).map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="pagination-dots-order">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={
                        page === currentPage ? "active-page-order" : ""
                      }
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredBookings.length / bookingPerPage)
                        ? prev + 1
                        : prev
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredBookings.length / bookingPerPage)
                  }
                >
                  »
                </button>
              </div>
            )}
          </>
        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
      </div>
      {showDeleteModal && (
        <div className="modal-overlay-booking">
          <div className="modal-booking">
            <h3>ยืนยันการลบ</h3>
            <p>ต้องการลบการจองนี้ใช่ไหม? เมื่อลบแล้วจะไม่สามารถกู้คืนได้</p>
            <div className="modal-actions-booking">
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-booking"
                onClick={confirmDeleteBooking}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ยืนยัน"
                )}
              </button>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="canbtn-booking"
                onClick={() => setShowDeleteModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
