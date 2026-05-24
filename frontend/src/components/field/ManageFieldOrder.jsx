"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/app/contexts/SocketContext";
import { formatDateToThai } from "@/app/utils/format";
import "@/app/css/my-order.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import Pagination from "@/components/ui/Pagination";
import BookingCard from "@/components/booking/BookingCard";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_ROLE, USER_STATUS, BOOKING_STATUS } from "@/constants/status";

export default function Myorder() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const socket = useSocket();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({
    bookingDate: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const router = useRouter();
  const { fieldId } = useParams();
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
        `/booking/my-orders/${fieldId}?${queryParams.toString()}`
      );

      setMybooking(data.data);
      setFieldName(data.fieldInfo?.field_name || "");
      setFieldOwnerId(data.fieldInfo?.field_owner_id || null);
      if (data.stats) console.log("Stats:", data.stats);
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
        notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
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
      console.log(" slot_booked received in ManageFieldOrder");
      fetchData();
    };

    const handleNewNotification = (data) => {
      if (
        [
          "new_booking",
          "booking_approved",
          "booking_rejected",
          "booking_complete",
          "deposit_payment_uploaded",
          "total_slip_payment_uploaded",
          "booking_cancelled",
          "cancel_booking_by_customer",
          "booking_verified",
        ].includes(data.topic)
      ) {
        console.log(`Real-time update: ${data.topic} received`);
        fetchData();
      }
    };

    socket.on("slot_booked", handleSlotBooked);
    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("slot_booked", handleSlotBooked);
      socket.off("new_notification", handleNewNotification);
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
      cancelled: booking.filter((item) => item.status === BOOKING_STATUS.CANCELLED).length,
      complete: booking.filter((item) => item.status === BOOKING_STATUS.COMPLETE).length,
      verified: booking.filter((item) => item.status === BOOKING_STATUS.VERIFIED).length,
      totalRevenue: booking

        .filter((item) => item.status === BOOKING_STATUS.COMPLETE)
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
      await apiClient.delete(`/booking/delete/${bookingIdToDelete}`);

      notify("ลบการจองสำเร็จ", "success");
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting booking:", error);
      notify(error.message || "ไม่สามารถลบการจองได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const stats = calculateStats();

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



  return (
    <>
      <div className="myorder-container">
        <h1>รายการจองสนาม {fieldName}</h1>

        <DateRangeFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          useDateRange={useDateRange}
          setUseDateRange={setUseDateRange}
          setFilters={setFilters}
          totalRevenue={stats.totalRevenue}
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
              <div className="stat-card rejected">
                <p className="stat-inline">
                  ยกเลิกแล้ว:{" "}
                  <span className="stat-number">{stats.cancelled}</span>
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
                <BookingCard
                  key={index}
                  booking={item}
                  showDeleteButton={user?.user_id === fieldOwnerId}
                  onDelete={handleDeleteBooking}
                />
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredBookings.length / bookingPerPage)}
              onPageChange={setCurrentPage}
            />
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
