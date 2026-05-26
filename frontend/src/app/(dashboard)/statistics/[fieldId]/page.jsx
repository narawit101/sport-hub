"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/app/contexts/SocketContext";
import {
  formatPrice,
  formatDateToThai,
  getBookingStatusDisplay,
} from "@/app/utils/format";
import "@/app/css/my-order.css";
import "@/app/css/field-statistics.css";
import Pagination from "@/components/ui/Pagination";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import BookingStatsSummary from "@/components/ui/BookingStatsSummary";
import apiClient from "@/lib/apiClient";
import { USER_STATUS, USER_ROLE, BOOKING_STATUS } from "@/constants/status";

export default function Statistics() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const socket = useSocket();
  const [booking, setBooking] = useState([]);
  const [filters, setFilters] = useState({
    bookingDate: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const router = useRouter();
  const { fieldId } = useParams();
  const [fieldName, setFieldName] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user?.role === USER_ROLE.CUSTOMER) router.replace("/");
    if (user?.status !== USER_STATUS.VERIFIED) {
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

      const data = await apiClient.get(
        `/statistics/${fieldId}?${queryParams.toString()}`,
      );

      if (data) {
        setBooking(data.data);
        setFieldName(data.fieldInfo?.field_name || "");
        console.log("Booking data:", data.data);
        if (data.stats) {
          console.log("Stats:", data.stats);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.fieldInfo) {
        setFieldName(error.fieldInfo.field_name || "");
        notify(
          `สนาม ${error.fieldInfo.field_name} ${error.fieldInfo.field_status}`,
          "error",
        );
        setTimeout(() => {
          router.replace("/my-field");
        }, 2000);
      } else {
        notify(error.message || "ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", "error");
      }
    } finally {
      setDataLoading(false);
    }
  }, [fieldId, filters, router, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleSlotBooked = () => {
      console.log(" slot_booked received in Stats");
      fetchData();
    };

    socket.on("slot_booked", handleSlotBooked);

    return () => {
      socket.off("slot_booked", handleSlotBooked);
    };
  }, [socket, fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: "", endDate: "", status: "", bookingDate: "" });
    setCurrentPage(1);
  };

  const formatDate = (isoString) => formatDateToThai(isoString);

  const calculateStats = () => {
    const stats = {
      total: booking.length,
      pending: booking.filter((item) => item.status === BOOKING_STATUS.PENDING)
        .length,
      approved: booking.filter(
        (item) => item.status === BOOKING_STATUS.APPROVED,
      ).length,
      rejected: booking.filter(
        (item) => item.status === BOOKING_STATUS.REJECTED,
      ).length,
      cancelled: booking.filter(
        (item) => item.status === BOOKING_STATUS.CANCELLED,
      ).length,
      complete: booking.filter(
        (item) => item.status === BOOKING_STATUS.COMPLETE,
      ).length,
      verified: booking.filter(
        (item) => item.status === BOOKING_STATUS.VERIFIED,
      ).length,
      totalRevenue: booking

        .filter((item) => item.status === BOOKING_STATUS.COMPLETE)
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0),
      totalDeposit: booking
        .filter((item) => item.status === BOOKING_STATUS.APPROVED)
        .reduce((sum, item) => sum + parseFloat(item.price_deposit || 0), 0),
    };
    return stats;
  };

  const stats = calculateStats();

  const bookingPerPage = 10;

  const filteredBookings = booking.filter((item) => {
    if (!filters.status) return true;
    return item.status === filters.status;
  });

  const indexOfLastBooking = currentPage * bookingPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking,
  );

  const onExport = async () => {
    if (!fieldId) return;

    const payload = {
      bookingDate: filters.bookingDate || "",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      status: filters.status || "",
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/export/${fieldId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        let fileName = "export.xlsx";
        const disposition = res.headers.get("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          fileName = decodeURIComponent(
            disposition.split("filename=")[1].split(";")[0].replace(/"/g, ""),
          );
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await res.text();
        console.error("Export error:", errorText);
        notify(errorText, "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      notify("เกิดข้อผิดพลาดในการส่งออกไฟล์", "error");
    }
  };

  return (
    <>
      <div className="myorder-container">
        <h1>สถิติการจองสนาม {fieldName}</h1>
        <DateRangeFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          useDateRange={useDateRange}
          setUseDateRange={setUseDateRange}
          setFilters={setFilters}
          totalRevenue={stats.totalRevenue}
          fetchData={fetchData}
        />

        {booking.length > 0 && (
          <BookingStatsSummary stats={stats}>
            <div className="export-button-container">
              <button
                className="export-button"
                onClick={onExport}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                ดาวน์โหลดสถิติ
              </button>
            </div>
          </BookingStatsSummary>
        )}

        {dataLoading ? (
          <div className="load-container-order">
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          <div>
            <div className="table-stat-container">
              <table className="table-stat">
                <thead>
                  <tr>
                    <th>วันที่จอง</th>
                    <th>ชื่อผู้จอง</th>
                    <th>สนาม/ย่อย</th>
                    <th>เวลาที่จอง</th>
                    <th>กิจกรรม</th>
                    <th>มัดจำ</th>
                    <th>ราคารวมสุทธิ</th>
                    <th>สิ่งอำนวยความสะดวก</th>
                    <th>รีวิว</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map((item, index) => (
                    <tr key={index} className="booking-data-table-stat">
                      <td style={{ whiteSpace: "nowrap" }}>
                        {formatDate(item.start_date)}{" "}
                        <a
                          href={`/booking-detail/${item.booking_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginLeft: "4px",
                            color: "#3b82f6",
                            cursor: "pointer",
                            textDecoration: "none",
                            fontWeight: "bold",
                          }}
                        >
                          ↗
                        </a>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        {item.first_name} {item.last_name}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {item.field_name} • {item.sub_field_name}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {item.start_time.substring(0, 5)} -{" "}
                        {item.end_time.substring(0, 5)}
                      </td>
                      <td>{item.activity}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {formatPrice(item.price_deposit)} บาท
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {formatPrice(item.total_price)} บาท
                      </td>
                      <td>
                        {Array.isArray(item.facilities) &&
                        item.facilities.length > 0 ? (
                          item.facilities.map((fac, i) => (
                            <span key={i}>
                              {fac.fac_name}
                              {i < item.facilities.length - 1 ? ", " : ""}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                      <td
                        className="review-cell"
                        style={{ textAlign: "center" }}
                      >
                        {item.status !== BOOKING_STATUS.COMPLETE ? (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        ) : item.rating != null ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#eab308" }}>
                              {item.rating} ★
                            </span>
                            {item.comment && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  display: "block",
                                  maxWidth: "160px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={item.comment}
                              >
                                {item.comment}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>ไม่มีรีวิว</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-text-detail-stat ${getBookingStatusDisplay(item).className}`}
                        >
                          {getBookingStatusDisplay(item).text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredBookings.length / bookingPerPage)}
              onPageChange={setCurrentPage}
              containerClassName="pagination-container-stat"
              activeClassName="active-page-stat"
              dotsClassName="pagination-dots-stat"
            />
          </div>
        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
      </div>
    </>
  );
}
