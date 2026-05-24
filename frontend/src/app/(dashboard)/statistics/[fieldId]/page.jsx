"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/app/contexts/SocketContext";
import { formatPrice, formatDateToThai, getBookingStatusDisplay } from "@/app/utils/format";
import "@/app/css/my-order.css";
import "@/app/css/field-statistics.css";
import Pagination from "@/components/ui/Pagination";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
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
        `/statistics/${fieldId}?${queryParams.toString()}`
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
          "error"
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
      pending: booking.filter((item) => item.status === BOOKING_STATUS.PENDING).length,
      approved: booking.filter((item) => item.status === BOOKING_STATUS.APPROVED).length,
      rejected: booking.filter((item) => item.status === BOOKING_STATUS.REJECTED).length,
      complete: booking.filter((item) => item.status === BOOKING_STATUS.COMPLETE).length,
      verified: booking.filter((item) => item.status === BOOKING_STATUS.VERIFIED).length,
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
    indexOfLastBooking
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/export/${fieldId}`, {
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
                    <td>{formatPrice(item.price_deposit)}</td>
                    <td>{formatPrice(item.total_price)}</td>
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
                      {item.status !== BOOKING_STATUS.COMPLETE
                        ? "ยังไม่มีคะแนน"
                        : item.rating != null
                          ? item.rating
                          : "ไม่มีรีวิว"}
                    </td>
                    <td>
                      {item.status !== BOOKING_STATUS.COMPLETE
                        ? "ยังไม่มีคอมเมนต์"
                        : item.comment != null
                          ? item.comment
                          : "ไม่มีรีวิว"}
                    </td>
                    <td className={`status-text-detail-stat ${getBookingStatusDisplay(item).className}`}>
                      {getBookingStatusDisplay(item).text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
