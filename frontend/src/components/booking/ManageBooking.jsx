"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/contexts/SocketContext";
import "@/app/css/my-order.css";
import { formatDateToThai } from "@/app/utils/format";
import Pagination from "@/components/ui/Pagination";
import BookingCard from "@/components/booking/BookingCard";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import BookingStatsSummary from "@/components/ui/BookingStatsSummary";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, BOOKING_STATUS } from "@/constants/status";

export default function Mybooking() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const socket = useSocket();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "" });
  const router = useRouter();
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

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const queryParams = new URLSearchParams();
      if (filters.date) queryParams.append("date", filters.date);
      if (filters.status) queryParams.append("status", filters.status);

      const data = await apiClient.get(
        `/booking/my-bookings/${user.user_id}?${queryParams.toString()}`,
      );

      setMybooking(data.data);
      setUserFirstUserName(data.user?.first_name || "");
      setUserLastUserName(data.user?.last_name || "");
      setUserInfo(
        `${data.user?.first_name || ""} ${data.user?.last_name || ""}`,
      );
      console.log("Booking Data:", data.data);
    } catch (error) {
      console.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setDataLoading(false);
    }
  }, [user?.user_id, filters, notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handleSlotBooked = () => {
      console.log("slot_booked → reload my-bookings");
      fetchData();
    };

    const handleNewNotification = (data) => {
      if (
        [
          "booking_approved",
          "booking_rejected",
          "booking_complete",
          "booking_cancelled",
          "cancel_booking_by_customer",
          "booking_verified",
        ].includes(data.topic)
      ) {
        console.log(`Real-time update my-bookings: ${data.topic} received`);
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

  const calculateStats = () => {
    return {
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
    };
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
    indexOfLastBooking,
  );

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
      <div className="myorder-container">
        <h1>
          การจองสนามของคุณ {userFirstName} {userLastName}
        </h1>

        <DateRangeFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          clearFilters={() => {
            setFilters({ date: "", status: "" });
            setCurrentPage(1);
          }}
          customerMode={true}
        />

        {booking.length > 0 && <BookingStatsSummary stats={stats} />}
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
                <BookingCard key={index} booking={item} userName={userInfo} />
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
    </>
  );
}
