"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import "@/app/css/my-order.css";
import { createSocket, logSocketError } from "@/app/lib/socket";
export default function Mybooking() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "" });
  const router = useRouter();
  const socketRef = useRef(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userFirstName, setUserFirstUserName] = useState("");
  const [userLastName, setUserLastUserName] = useState("");
  const [userInfo, setUserInfo] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const queryParams = new URLSearchParams();
      if (filters.date) queryParams.append("date", filters.date);
      if (filters.status) queryParams.append("status", filters.status);

      const res = await fetch(
        `${API_URL}/booking/my-bookings/${
          user.user_id
        }?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMybooking(data.data);
        setUserFirstUserName(data.user?.first_name || "");
        setUserLastUserName(data.user?.last_name || "");
        setUserInfo(
          `${data.user?.first_name || ""} ${data.user?.last_name || ""}`
        );
        console.log("Booking Data:", data.data);
      } else {
        console.log("Booking fetch error:", data.error);
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [user?.user_id, filters, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log("API_URL:", API_URL);
    console.log(" connecting socket...");

    socketRef.current = createSocket(API_URL);
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("slot_booked", () => {
      console.log("slot_booked → reload my-bookings");
      fetchData();
    });

    socket.on("connect_error", (err) => {
      logSocketError("ManageBooking", err);
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (
      !start_date ||
      !start_time ||
      cancel_hours === undefined ||
      cancel_hours === null
    ) {
      return "-";
    }

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;

    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);

    if (isNaN(bookingDateTime.getTime())) {
      console.log(" Invalid Date from:", cleanDate, start_time);
      return "-";
    }

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getFacilityNetPrice = (item) => {
    const totalFac = (item.facilities || []).reduce(
      (sum, fac) => sum + (parseFloat(fac.fac_price) || 0),
      0
    );
    return Math.abs(totalFac - (parseFloat(item.total_remaining) || 0));
  };
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (dataLoading) return;
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll(".booking-list .booking-card");
      let max = 0;
      cards.forEach((c) => {
        max = Math.max(max, c.offsetHeight);
      });
      cards.forEach((c) => {
        c.style.minHeight = max + "px";
      });
    });
  }, [currentBookings, dataLoading]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myorder-container">
        <h1 className="head-title-my-order">
          การจองสนามของคุณ {userFirstName} {userLastName}
        </h1>

        <div className="filters-order">
          <label>
            วันที่:
            <input
              type="date"
              name="date"
              value={filters.date}
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
          <div className="button-clear-order">
            <button
              className="clear-filters-btn-date"
              onClick={() => {
                setFilters({ date: "", status: "" });
                setCurrentPage(1);
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>
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
                      {userInfo}
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
                        {item.cancel_hours > 0 && (
                          <p>
                            <strong> สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                            {item.cancel_hours} ชม.
                          </p>
                        )}
                      </div>
                      {item.cancel_hours > 0 && (
                        <div className="total-date-order">
                          <hr className="divider-order" />

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
                      )}
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
    </>
  );
}
