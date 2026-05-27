"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import "@/app/css/notifications.css";
import "@/app/css/navbar.css";
import { useSocket } from "@/app/contexts/SocketContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS } from "@/constants/status";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function Page() {
  const { userId } = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const lastLoadTime = useRef(0);
  const loadingRef = useRef(false);

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    setDataLoading(true);
    try {
      const data = await apiClient.get(`/notification/all/${userId}`);
      if (Array.isArray(data)) {
        const formatted = data.map((notification) => ({
          notifyId: notification.notify_id,
          keyId: notification.key_id,
          topic: notification.topic,
          senderName: `${notification.sender_first_name || ""} ${
            notification.sender_last_name || ""
          }`.trim(),
          reciveName: `${notification.recive_first_name || ""} ${
            notification.recive_last_name || ""
          }`.trim(),
          fieldName: notification.field_name || "",
          fieldId: notification.field_id || notification.fieldId || null,
          subFieldName: notification.sub_field_name || "",
          bookingDate: notification.booking_date || null,
          startTime: `${notification.start_time}`.substring(0, 5) || null,
          endTime: `${notification.end_time}`.substring(0, 5) || null,
          rawMessage: notification.messages || "",
          postContent: notification.content || "",
          created_at: notification.created_at,
          status: notification.status,
          isRead: String(notification.status).toLowerCase() !== "unread",
        }));
        setNotifications(formatted);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.error("fetchNotifications error", e);
    } finally {
      loadingRef.current = false;
      setDataLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markOneAsRead = async (notification) => {
    if (!notification || !notification.keyId) return;
    try {
      await apiClient.put("/notification/read-notification", {
        key_id: notification.keyId,
      });
    } catch (e) {
      console.error("markOneAsRead error", e);
    }
  };

  const handleNotificationClick = (n) => {
    setNotifications((prev) =>
      prev.map((x) =>
        x.notifyId === n.notifyId ? { ...x, status: "read", isRead: true } : x,
      ),
    );
    const remaining = notifications.filter(
      (x) =>
        x.notifyId !== n.notifyId &&
        !x.isRead &&
        String(x.status).toLowerCase() === "unread",
    ).length;
    window.dispatchEvent(
      new CustomEvent("notifications-marked-read", {
        detail: { unreadCount: remaining },
      }),
    );
    markOneAsRead(n);
    const topic = n.topic;
    const keyId = n.keyId;
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
      ].includes(topic)
    ) {
      if (keyId) router.push(`/booking-detail/${keyId}`);
      else notify("ไม่พบข้อมูลการจองนี้", "error");
      return;
    }
    if (
      [
        "field_registered",
        "field_approved",
        "field_rejected",
        "field_appeal",
      ].includes(topic)
    ) {
      if (keyId) router.push(`/check-field/${keyId}`);
      else notify("ไม่พบข้อมูลสนามนี้", "error");
      return;
    }
    if (["field_posted"].includes(topic)) {
      if (keyId) router.push(`/profile/${n.fieldId || ""}?highlight=${keyId}`);
      else notify("ไม่พบข้อมูลโพสต์นี้", "error");
      return;
    }
    if (["new_following"].includes(topic)) {
      if (keyId) router.push(`/profile/${keyId}`);
      else notify("ไม่พบข้อมูลสนามนี้", "error");
      return;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(
        `/notification/delete-notification/${notificationId}`,
      );
      setNotifications((prev) =>
        prev.filter((n) => n.notifyId !== notificationId),
      );
      notify("ลบการแจ้งเตือนแล้ว", "success");
    } catch (err) {
      notify(err.message || "ไม่สามารถลบการแจ้งเตือนได้", "error");
    }
  };

  const handleMarkAllRead = async () => {
    if (markAllLoading) return;
    const hasUnread = notifications.some(
      (n) => !n.isRead && String(n.status).toLowerCase() === "unread",
    );
    if (!hasUnread) return;
    try {
      setMarkAllLoading(true);
      await apiClient.put("/notification/read-all-notification");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read", isRead: true })),
      );
      window.dispatchEvent(
        new CustomEvent("notifications-marked-read", {
          detail: { unreadCount: 0 },
        }),
      );
      notify("ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว", "success");
    } catch (e) {
      notify(e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    } finally {
      setMarkAllLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !user?.user_id) return;
    const handleNewNotification = (data) => {
      if (parseInt(data?.reciveId) !== parseInt(user.user_id)) return;
      if (data.topic === "reset_count" || data.topic === "update_count") {
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { unreadCount: data.unreadCount || 0 },
          }),
        );
        return;
      }
      const now = Date.now();
      if (now - lastLoadTime.current < 1500) return;
      lastLoadTime.current = now;
      fetchNotifications();
    };
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket, user?.user_id, fetchNotifications]);

  const renderNotificationContent = (n) => {
    const isBookingRelated = [
      "new_booking",
      "booking_approved",
      "booking_rejected",
      "booking_complete",
      "booking_verified",
      "deposit_payment_uploaded",
      "total_slip_payment_uploaded",
      "booking_cancelled",
      "cancel_booking_by_customer",
    ].includes(n.topic);

    const isFieldRelated = [
      "field_registered",
      "field_approved",
      "field_rejected",
      "field_appeal",
    ].includes(n.topic);

    return (
      <div className="notif-content-wrapper">
        {n.topic === "new_booking" && (
          <strong className="notif-topic-title">มีการจองสนามใหม่</strong>
        )}
        {n.topic === "booking_approved" && (
          <strong className="notif-topic-title">
            การจองได้รับการอนุมัติแล้ว
          </strong>
        )}
        {n.topic === "booking_rejected" && (
          <strong className="notif-topic-title">การจองถูกปฏิเสธ</strong>
        )}
        {n.topic === "booking_complete" && (
          <strong className="notif-topic-title">การจองเสร็จสิ้น</strong>
        )}
        {n.topic === "booking_verified" && (
          <strong className="notif-topic-title">
            สลิปมัดจำของคุณได้รับการยืนยันแล้ว
          </strong>
        )}
        {n.topic === "deposit_payment_uploaded" && (
          <strong className="notif-topic-title">มีการอัปโหลดสลิปมัดจำ</strong>
        )}
        {n.topic === "total_slip_payment_uploaded" && (
          <strong className="notif-topic-title">
            มีการอัปโหลดสลิปยอดทั้งหมด
          </strong>
        )}
        {n.topic === "field_registered" && (
          <strong className="notif-topic-title">มีการลงทะเบียนสนามใหม่</strong>
        )}
        {n.topic === "field_approved" && (
          <strong className="notif-topic-title">
            สนามกีฬาของคุณได้รับการอนุมัติ
          </strong>
        )}
        {n.topic === "field_appeal" && (
          <strong className="notif-topic-title">
            คำร้องลงทะเบียนสนามอีกครั้ง
          </strong>
        )}
        {n.topic === "field_rejected" && (
          <strong className="notif-topic-title">
            สนามกีฬาของคุณไม่ได้รับการอนุมัติ
          </strong>
        )}
        {n.topic === "field_posted" && (
          <strong className="notif-topic-title">
            มีโพสต์ใหม่จากสนามที่คุณติดตาม
          </strong>
        )}
        {n.topic === "booking_cancelled" && (
          <strong className="notif-topic-title">
            การจองถูกยกเลิกโดยเจ้าของสนาม
          </strong>
        )}
        {n.topic === "cancel_booking_by_customer" && (
          <strong className="notif-topic-title">
            การจองถูกยกเลิกโดยลูกค้า
          </strong>
        )}
        {n.topic === "new_following" && (
          <strong className="notif-topic-title">
            มีผู้ติดตามใหม่ในสนามของคุณ
          </strong>
        )}

        {![
          "new_booking",
          "booking_approved",
          "booking_rejected",
          "booking_complete",
          "booking_verified",
          "deposit_payment_uploaded",
          "total_slip_payment_uploaded",
          "field_registered",
          "field_approved",
          "field_appeal",
          "field_rejected",
          "field_posted",
          "booking_cancelled",
          "cancel_booking_by_customer",
          "new_following",
        ].includes(n.topic) && (
          <strong className="notif-topic-title">การแจ้งเตือน</strong>
        )}

        <div className="notif-details">
          {isBookingRelated && (
            <>
              {/* <small>หมายเลข: #{n.keyId}</small> */}
              {n.senderName && <small>ผู้จอง: {n.senderName}</small>}
              {n.reciveName && n.topic !== "new_booking" && (
                <small>ผู้รับ: {n.reciveName}</small>
              )}
              {n.fieldName && (
                <small>
                  สนาม: {n.fieldName}{" "}
                  {n.subFieldName && (
                    <>
                      <br />
                      สนามย่อย: {n.subFieldName}
                    </>
                  )}
                </small>
              )}
              {n.bookingDate && (
                <small>
                  วันที่: {formatDate(n.bookingDate)}
                  <br />
                  เวลา: {n.startTime} - {n.endTime}
                </small>
              )}
              {[
                "booking_rejected",
                "booking_cancelled",
                "cancel_booking_by_customer",
              ].includes(n.topic) &&
                n.rawMessage && (
                  <div className="notif-rejected-all-reson">
                    เหตุผล: {n.rawMessage}
                  </div>
                )}
              {n.topic === "booking_complete" && (
                <small className="notif-hint">
                  กรณีต้องการให้คะแนนสนาม คลิกที่หมายเลขการจองนี้
                </small>
              )}
            </>
          )}

          {isFieldRelated && (
            <>
              {n.senderName && <small>เจ้าของสนาม: {n.senderName}</small>}
              {n.reciveName && n.topic === "field_approved" && (
                <small>เจ้าของสนาม: {n.reciveName}</small>
              )}
              {n.topic === "field_rejected" && n.rawMessage && (
                <div className="notif-rejected-all-reson">
                  เหตุผล: {n.rawMessage}
                </div>
              )}
            </>
          )}

          {n.topic === "field_posted" && (
            <>
              {n.fieldName && <small>สนาม: {n.fieldName}</small>}
              {n.postContent && (
                <small>หัวข้อ: {n.postContent.slice(0, 80)}...</small>
              )}
            </>
          )}

          {n.topic === "new_following" && (
            <small>ผู้ติดตาม: {n.senderName || "-"}</small>
          )}

          {!isBookingRelated &&
            !isFieldRelated &&
            n.topic !== "field_posted" &&
            n.topic !== "new_following" && <small>Ref: #{n.keyId}</small>}
        </div>
      </div>
    );
  };

  return (
    <div className="notification-page-container">
      <div className="noti-header-maker-read">
        <div className="notify-read-unread">
          <h2 className="noti-page-title">การแจ้งเตือนทั้งหมด</h2>
          <div className="unread-stats">
            {notifications.length} ข้อความ | ยังไม่อ่าน{" "}
            {notifications.filter((n) => !n.isRead).length} ข้อความ
          </div>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={markAllLoading || !notifications.some((n) => !n.isRead)}
          className="noti-mark-all-btn"
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
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {markAllLoading ? "กำลังดำเนินการ..." : "อ่านทั้งหมด"}
        </button>
      </div>

      <div className="noti-page-list">
        {dataLoading && !notifications.length ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={"skeleton-" + idx}
              className="notification-item-page skeleton"
            >
              <div className="skel-line w40" />
              <div className="skel-line w65" />
              <div className="skel-line w55" />
            </div>
          ))
        ) : notifications.length ? (
          notifications.map((n, i) => (
            <div
              key={n.notifyId || i}
              className={`notification-item-page ${!n.isRead ? "unread" : ""}`}
              onClick={() => handleNotificationClick(n)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.notifyId);
                }}
                className="notif-button-delete"
                title="ลบ"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              {renderNotificationContent(n)}
              <div className="noti-footer">
                <span className="noti-created-at">
                  {n.created_at ? dayjs(n.created_at).fromNow() : ""}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-booking-container">
            <div className="empty-booking-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <h3 className="empty-booking-title">ไม่มีการแจ้งเตือน</h3>
            <p className="empty-booking-description">
              คุณยังไม่มีรายการแจ้งเตือนในขณะนี้
              เมื่อมีความเคลื่อนไหวระบบจะแจ้งให้คุณทราบทันที
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
