"use client";
import { createSocket, logSocketError } from "@/app/lib/socket";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import "@/app/css/notifications.css";
import "@/app/css/navbar.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
dayjs.extend(relativeTime);
dayjs.locale("th");
export default function Page() {
  const { userId } = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const socketRef = useRef(null);
  const lastLoadTime = useRef(0);
  const loadingRef = useRef(false);

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchNotifications = useCallback(async () => {
    if (!API_URL || !userId || loadingRef.current) return;
    loadingRef.current = true;
    setDataLoading(true);
    try {
      const res = await fetch(`${API_URL}/notification/all/${userId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
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
      }
    } catch (e) {
      console.error("fetchNotifications error", e);
    } finally {
      loadingRef.current = false;
      setDataLoading(false);
    }
  }, [API_URL, userId]);
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markOneAsRead = async (notification) => {
    if (!notification || !notification.keyId) return;
    try {
      await fetch(`${API_URL}/notification/read-notification`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: notification.keyId }),
      });
    } catch (e) {
      console.error("markOneAsRead error", e);
    }
  };

  const handleNotificationClick = (n) => {
    setNotifications((prev) =>
      prev.map((x) =>
        x.notifyId === n.notifyId ? { ...x, status: "read", isRead: true } : x
      )
    );
    const remaining = notifications.filter(
      (x) =>
        x.notifyId !== n.notifyId &&
        !x.isRead &&
        String(x.status).toLowerCase() === "unread"
    ).length;
    window.dispatchEvent(
      new CustomEvent("notifications-marked-read", {
        detail: { unreadCount: remaining },
      })
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
      else {
        setMessage("ไม่พบข้อมูลการจองนี้");
        setMessageType("error");
      }
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
      else {
        setMessage("ไม่พบข้อมูลสนามนี้");
        setMessageType("error");
      }
      return;
    }
    if (["field_posted"].includes(topic)) {
      if (keyId) {
        router.push(
          `/profile/${n.fieldId || n.field_id || ""}?highlight=${keyId}`
        );
      } else {
        setMessage("ไม่พบข้อมูลโพสต์นี้");
        setMessageType("error");
      }
      return;
    }
    if (["new_following"].includes(topic)) {
      if (keyId) {
        router.push(`/profile/${keyId}`);
      } else {
        setMessage("ไม่พบข้อมูลสนามนี้");
        setMessageType("error");
      }
      return;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(
        `${API_URL}/notification/delete-notification/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.notifyId !== notificationId)
        );
        setMessage("ลบการแจ้งเตือนแล้ว");
        setMessageType("success");
      }
    } catch (err) {
      console.error("deleteNotification error", err);
      setMessage("ไม่สามารถลบการแจ้งเตือนได้");
      setMessageType("error");
    } finally {
    }
  };
  const handleMarkAllRead = async () => {
    if (!API_URL || markAllLoading) return;
    const hasUnread = notifications.some(
      (n) => !n.isRead && String(n.status).toLowerCase() === "unread"
    );
    if (!hasUnread) return;
    try {
      setMarkAllLoading(true);
      const res = await fetch(`${API_URL}/notification/read-all-notification`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: "read", isRead: true }))
        );
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { unreadCount: 0 },
          })
        );
        setMessage("ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว");
        setMessageType("success");
      } else {
        setMessage("ไม่สามารถทำเครื่องหมายทั้งหมดได้");
        setMessageType("error");
      }
    } catch (e) {
      setMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setMessageType("error");
    } finally {
      setMarkAllLoading(false);
    }
  };

  useEffect(() => {
    if (!API_URL || !user?.user_id) return;
    const socket = createSocket(API_URL);
    if (!socket) return;
    socketRef.current = socket;
    socket.on("new_notification", (data) => {
      if (parseInt(data?.reciveId) !== parseInt(user.user_id)) return;
      if (data.topic === "reset_count" || data.topic === "update_count") {
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { unreadCount: data.unreadCount || 0 },
          })
        );
        return;
      }
      const now = Date.now();
      if (now - lastLoadTime.current < 1500) return;
      lastLoadTime.current = now;
      fetchNotifications();
    });
    socket.on("connect_error", (err) => {
      logSocketError("Notifications", err);
    });
    return () => socket.disconnect();
  }, [API_URL, user?.user_id, fetchNotifications]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="notification-page-container">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="noti-header-maker-read">
        <div className="notify-read-unread">
          <img
            width={30}
            height={30}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157482/mdi-light--bell_wt2uc1.png"
            alt=""
          />
          <h2 className="noti-page-title">การแจ้งเตือนทั้งหมด</h2>
          <p style={{ fontSize: "15px" }}>
            {" "}
            {notifications.length} ข้อความ ยังไม่อ่าน {""}
            {
              notifications.filter(
                (n) => String(n.status).toLowerCase() === "unread"
              ).length
            }{" "}
            ข้อความ
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={
            markAllLoading ||
            !notifications.some(
              (n) => String(n.status).toLowerCase() === "unread"
            )
          }
          className="noti-mark-all-btn"
        >
          <img
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756895721/el--ok_kmd6sx.png"
            alt=""
          />
          {markAllLoading ? "..." : "ทำเคื่องหมายทั้งหมดว่าอ่านแล้ว"}
        </button>
      </div>
      <ol className="noti-page-list">
        {dataLoading &&
          !notifications.length &&
          Array.from({ length: 5 }).map((_, idx) => (
            <li
              key={"skeleton-" + idx}
              className="notification-item-page skeleton"
            >
              <div className="skel-line w40" />
              <div className="skel-line w65" />
              <div className="skel-line w55" />
              <div className="skel-line w30" />
            </li>
          ))}
        {dataLoading && notifications.length > 0 && (
          <li className="notification-item-page loading-inline"></li>
        )}
        {notifications.length ? (
          notifications.map((n, i) => {
            const isUnread =
              !n.isRead && String(n.status).toLowerCase() === "unread";
            return (
              <li
                key={n.notifyId || n.keyId || `${n.topic}-${i}`}
                className={`notification-item-page ${isUnread ? "unread" : ""}`}
                onClick={() => handleNotificationClick(n)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.notifyId);
                  }}
                  className="notif-button-delete"
                  type="button"
                >
                  <img
                    width={15}
                    height={15}
                    style={{
                      display: "block",
                    }}
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                    alt=""
                  />
                </button>
                {n.topic === "new_booking" && (
                  <>
                    <strong className="notif-new_booking-all">
                      มีการจองสนามใหม่
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.senderName && (
                      <small>ผู้จอง: {n.senderName || "-"}</small>
                    )}
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "booking_approved" && (
                  <>
                    <strong className="notif-new_booking-all">
                      การจองได้รับการอนุมัติแล้ว
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.reciveName && (
                      <small>ผู้จอง: {n.reciveName || "-"}</small>
                    )}
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "booking_rejected" && (
                  <>
                    <strong className="notif-new_booking-all">
                      การจองถูกปฏิเสธ
                    </strong>
                    <br />
                    <small className="notif-rejected-all-reson">
                      เหตุผล: {n.rawMessage || "-"}
                    </small>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.reciveName && (
                      <small>ผู้จอง: {n.reciveName || "-"}</small>
                    )}
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                    <br />
                  </>
                )}
                {n.topic === "booking_complete" && (
                  <>
                    <strong className="notif-new_booking-all">
                      การจองเสร็จสิ้น
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                    <br />
                    <small className="notif-hint">
                      กรณีต้องการให้คะแนนสนาม คลิกที่หมายเลขการจองนี้
                    </small>
                  </>
                )}
                {n.topic === "booking_verified" && (
                  <>
                    <strong className="notif-new_booking-all">
                      สลิปมัดจำของคุณได้รับการยืนยันแล้ว
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.reciveName && (
                      <small>ผู้จอง: {n.reciveName || "-"}</small>
                    )}
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                    <br />
                  </>
                )}
                {n.topic === "deposit_payment_uploaded" && (
                  <>
                    <strong className="notif-new_booking-all">
                      มีการอัปโหลดสลิปมัดจำ
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "total_slip_payment_uploaded" && (
                  <>
                    <strong className="notif-new_booking-all">
                      มีการอัปโหลดสลิปยอดทั้งหมด
                    </strong>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    {n.fieldName && (
                      <small>
                        สนาม: {n.fieldName || "-"}
                        <br />
                        สนามย่อย: {n.subFieldName || "-"}
                      </small>
                    )}
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "field_registered" && (
                  <>
                    <strong className="notif-new_booking-all">
                      มีการลงทะเบียนสนามใหม่
                    </strong>
                    <br />
                    {n.senderName && (
                      <small>เจ้าของสนาม: {n.senderName || "-"}</small>
                    )}
                  </>
                )}
                {n.topic === "field_approved" && (
                  <>
                    <strong className="notif-new_booking-all">
                      สนามกีฬาของคุณได้รับการอนุมัติ
                    </strong>
                    <br />
                    {n.senderName && (
                      <small>เจ้าของสนาม: {n.reciveName || "-"}</small>
                    )}
                  </>
                )}
                {n.topic === "field_appeal" && (
                  <>
                    <strong className="notif-new_booking-all">
                      คำร้องลงทะเบียนสนามอีกครั้ง
                    </strong>
                    <br />
                    {n.senderName && (
                      <small>เจ้าของสนาม: {n.senderName || "-"}</small>
                    )}
                  </>
                )}
                {n.topic === "field_rejected" && (
                  <>
                    <strong className="notif-new_booking-all">
                      สนามกีฬาของคุณไม่ได้รับการอนุมัติ
                    </strong>
                    <br />
                    <small className="notif-rejected-all-reson">
                      เหตุผล: {n.rawMessage || "-"}
                    </small>
                    <br />
                    {n.senderName && (
                      <small>เจ้าของสนาม: {n.reciveName || "-"}</small>
                    )}
                  </>
                )}
                {n.topic === "field_posted" && (
                  <>
                    <strong className="notif-new_booking-all">
                      มีโพสต์ใหม่จากสนามที่คุณติดตาม
                    </strong>
                    <br />
                    {n.fieldName && <small>สนาม: {n.fieldName || "-"}</small>}
                    <br />
                    {n.postContent && (
                      <small>หัวข้อ: {n.postContent.slice(0, 80)}</small>
                    )}
                  </>
                )}
                {n.topic === "booking_cancelled" && (
                  <>
                    <strong className="notif-new_booking">
                      การจองถูกยกเลิกโดยเจ้าของสนาม
                    </strong>
                    <br />
                    <small className="notif-rejected-all-reson">
                      เหตุผล: {n.rawMessage}
                    </small>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    <small>ผู้จอง: {n.reciveName || "-"}</small>
                    <br />
                    <small>
                      สนาม: {n.fieldName || "-"}
                      <br />
                      สนามย่อย: {n.subFieldName || "-"}
                    </small>
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "cancel_booking_by_customer" && (
                  <>
                    <strong className="notif-new_booking">
                      การจองถูกยกเลิกโดยลูกค้า
                    </strong>
                    <br />
                    <small className="notif-rejected-all-reson">
                      เหตุผล: {n.rawMessage}
                    </small>
                    <br />
                    <small>หมายเลข: #{n.keyId}</small>
                    <br />
                    <small>ผู้จอง: {n.senderName || "-"}</small>
                    <br />
                    <small>
                      สนาม: {n.fieldName || "-"}
                      <br />
                      สนามย่อย: {n.subFieldName || "-"}
                    </small>
                    <br />
                    {n.bookingDate && (
                      <small>
                        วันที่: {formatDate(n.bookingDate)}
                        <br />
                        เวลา: {n.startTime} - {n.endTime}
                      </small>
                    )}
                  </>
                )}
                {n.topic === "new_following" && (
                  <>
                    <strong className="notif-new_booking">
                      มีผู้ติดตามใหม่ในสนามของคุณ
                    </strong>
                    <br />
                    <small>ผู้ติดตาม: {n.senderName || "-"}</small>
                    <br />
                  </>
                )}
                {![
                  "new_booking",
                  "booking_approved",
                  "booking_rejected",
                  "booking_complete",
                  "booking_cancelled",
                  "deposit_payment_uploaded",
                  "total_slip_payment_uploaded",
                  "field_registered",
                  "field_approved",
                  "field_rejected",
                  "field_appeal",
                  "field_posted",
                  "booking_cancelled",
                  "cancel_booking_by_customer",
                  "new_following",
                  "booking_verified",
                ].includes(n.topic) && (
                  <>
                    <strong>การแจ้งเตือน</strong>
                    <br />
                    <small>Ref: #{n.keyId}</small>
                  </>
                )}
                <div className="noti-created-at">
                  {n.created_at ? dayjs(n.created_at).fromNow() : ""}
                </div>
              </li>
            );
          })
        ) : (
          <li className="notification-item-page empty">ไม่มีการแจ้งเตือน</li>
        )}
      </ol>
    </div>
  );
}
