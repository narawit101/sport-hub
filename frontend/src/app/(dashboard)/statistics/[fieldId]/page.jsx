"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { createSocket, logSocketError } from "@/app/lib/socket";
import "@/app/css/my-order.css";
import "@/app/css/field-statistics.css";
import { verify } from "jsonwebtoken";

export default function Statistics() {
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
  const [dataLoading, setDataLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
        `${API_URL}/statistics/${fieldId}?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMybooking(data.data);
        setFieldName(data.fieldInfo?.field_name || "");
        console.log("Booking data:", data.data);
        if (data.stats) {
          console.log("Stats:", data.stats);
        }
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
        console.log("Booking fetch error:", data.error);
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
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
      logSocketError("Statistics", err);
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
      totalDeposit: booking
        .filter((item) => item.status === "approved")
        .reduce((sum, item) => sum + parseFloat(item.price_deposit || 0), 0),
    };
    return stats;
  };

  const stats = calculateStats();
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const bookingPerPage = 10;

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

  const onExport = async () => {
    if (!fieldId) return;

    const payload = {
      bookingDate: filters.bookingDate || "",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      status: filters.status || "",
    };

    const res = await fetch(`${API_URL}/statistics/export/${fieldId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      let fileName = "export.xlsx";
      const disposition = res.headers.get("Content-Disposition");
      if (disposition && disposition.includes("filename=")) {
        fileName = decodeURIComponent(
          disposition.split("filename=")[1].split(";")[0].replace(/"/g, "")
        );
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      // setMessage("ดาวน์โหลดไฟล์สำเร็จ");
      // setMessageType("success");
    } else {
      const errorText = await res.text();
      console.error("Export error:", errorText);
      setMessage(errorText);
      setMessageType("error");
    }
  };

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myorder-container">
        <h1>สถิติการจองสนาม {fieldName}</h1>
        {useDateRange && (
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
                  setFilters({
                    bookingDate: "",
                    startDate: "",
                    endDate: "",
                    status: "",
                  });
                  setCurrentPage(1);
                  setTimeout(() => {
                    fetchData();
                  }, 0);
                }}
              >
                {!useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
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

        {!useDateRange && (
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

            <button onClick={clearFilters} className="clear-filters-btn">
              ล้างตัวกรอง
            </button>
            <button
              className="swip-mode-order"
              type="button"
              onClick={() => {
                setUseDateRange((prev) => !prev);
                setFilters({
                  bookingDate: "",
                  startDate: "",
                  endDate: "",
                  status: "",
                });
                setCurrentPage(1);
                setTimeout(() => {
                  fetchData();
                }, 0);
              }}
            >
              {!useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
            </button>
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
              <div className="stat-card approved">
                <p className="stat-inline">
                  การจองสำเร็จ:{" "}
                  <span className="stat-number">{stats.complete}</span>
                </p>
              </div>
              <div className="stat-card approved">
                <p className="stat-inline">
                  ตรวจสอบสลิปค่ามัดจำแล้ว:{" "}
                  <span className="stat-number">{stats.verified}</span>
                </p>
              </div>
            </div>
            <div className="export-button-container">
              <button className="export-button" onClick={onExport}>
                <img
                  src="data:image/png;base64,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"
                  width={20}
                  height={20}
                  alt=""
                />
                ดาวน์โหลดสถิติ
              </button>
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="load-container-order">
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          <div>
            <table className="table-stat">
              <thead>
                <tr>
                  <th>วันที่จอง</th>
                  <th>ชื่อผู้จอง</th>
                  <th>สนาม</th>
                  <th>สนามย่อย</th>
                  <th>เวลาที่จอง</th>
                  <th>กิจกรรม</th>
                  <th>มัดจำ</th>
                  <th>ราคารวมสุทธิ</th>
                  <th>สิ่งอำนวยความสะดวก</th>
                  <th>คะแนนรีวิว</th>
                  <th>คอมเมนต์</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.map((item, index) => (
                  <tr key={index} className="booking-data-table-stat">
                    <td>
                      {formatDate(item.start_date)}{" "}
                      <a
                        href={`/booking-detail/${item.booking_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: "8px",
                          color: "blue",
                          cursor: "pointer",
                          textDecoration: "none",
                        }}
                      >
                        ↗
                      </a>
                    </td>

                    <td>
                      {item.first_name} {item.last_name}
                    </td>
                    <td>{item.field_name}</td>
                    <td>{item.sub_field_name}</td>
                    <td>
                      {item.start_time.substring(0, 5)} -{" "}
                      {item.end_time.substring(0, 5)}
                    </td>
                    <td>{item.activity}</td>
                    <td>{item.price_deposit}</td>
                    <td>{item.total_price}</td>
                    <td>
                      {Array.isArray(item.facilities) &&
                      item.facilities.length > 0
                        ? item.facilities.map((fac, i) => (
                            <span key={i}>
                              {fac.fac_name}
                              {i < item.facilities.length - 1 ? ", " : ""}
                            </span>
                          ))
                        : "ไมได้เลือก"}
                    </td>
                    <td>
                      {item.status !== "complete"
                        ? "ยังไม่มีคะแนน"
                        : item.rating != null
                        ? item.rating
                        : "ไม่มีรีวิว"}
                    </td>
                    <td>
                      {item.status !== "complete"
                        ? "ยังไม่มีคอมเมนต์"
                        : item.comment != null
                        ? item.comment
                        : "ไม่มีรีวิว"}
                    </td>
                    <td className={`status-text-detail-stat ${item.status}`}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length > bookingPerPage && (
              <div className="pagination-container-stat">
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
                    <span key={index} className="pagination-dots-stat">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "active-page-stat" : ""}
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
          </div>
        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
      </div>
    </>
  );
}
