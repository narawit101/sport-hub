"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import NotFoundCard from "@/components/ui/NotFoundCard";
import "@/app/css/field-profile.css";
import Post from "@/components/post/Post";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSocket } from "@/app/contexts/SocketContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { formatPrice, daysInThai } from "@/app/utils/format";
import Pagination from "@/components/ui/Pagination";
import PostCard from "@/components/post/PostCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LongdoMapPicker from "@/components/shared/LongdoMapPicker";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, USER_ROLE, FIELD_STATUS } from "@/constants/status";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function CheckFieldDetail() {
  const { notify } = useNotification();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { fieldId } = useParams();
  const [fieldData, setFieldData] = useState(null);
  const [postData, setPostData] = useState([]);
  const [canPost, setCanPost] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalFollower, setShowModalFollower] = useState(false);
  const [showModalDescription, setShowModalDescription] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [reviewData, setReviewData] = useState([]);
  const [selectedRating, setSelectedRating] = useState("ทั้งหมด");
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightMissing, setHighlightMissing] = useState(false);
  usePreventLeave(startProcessLoad);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [showSubfieldModal, setShowSubfieldModal] = useState(false);
  const [userFollowing, setUserFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [dataFollowers, setDataFollowers] = useState([]);
  const socket = useSocket();

  const fetchFollowing = useCallback(async () => {
    if (!user?.user_id || !fieldId) return;
    try {
      const data = await apiClient.get(`/following/get-following/${user.user_id}/${fieldId}`);
      if (data.following === 1) {
        setUserFollowing(true);
      } else {
        setUserFollowing(false);
      }
    } catch (error) {
      console.error("Error fetching following status:", error);
    }
  }, [user?.user_id, fieldId]);

  const fetchFollowerAll = useCallback(async () => {
    if (!fieldId) return;
    try {
      const data = await apiClient.get(`/following/all-followers/${fieldId}`);
      setFollowers(data.countFollowers || 0);
      setDataFollowers(data.data || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  }, [fieldId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleFollowing = (data) => {
      if (data.fieldId === Number(fieldId)) {
        fetchFollowerAll();
        if (data.userId === Number(user?.user_id)) {
          fetchFollowing();
        }
      }
    };

    const handleNewPostCreated = (data) => {
      if (data.fieldId === Number(fieldId)) {
        setPostData((prevPosts) => {
          console.log("Previous posts count:", prevPosts.length);
          const newPosts = [data.post, ...prevPosts];
          console.log("New posts count:", newPosts.length);
          return newPosts;
        });
        setCurrentPage(1);
      }
    };

    const handlePostDeleted = (data) => {
      if (data.fieldId === Number(fieldId)) {
        setPostData((prevPosts) => {
          const filteredPosts = prevPosts.filter(
            (post) => post.post_id !== data.postId
          );
          return filteredPosts;
        });
      }
    };

    socket.on("following", handleFollowing);
    socket.on("new_post_created", handleNewPostCreated);
    socket.on("post_deleted", handlePostDeleted);
    
    return () => {
      socket.off("following", handleFollowing);
      socket.off("new_post_created", handleNewPostCreated);
      socket.off("post_deleted", handlePostDeleted);
    };
  }, [socket, fieldId, user, fetchFollowing, fetchFollowerAll]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      return;
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }

    if (highlightId && postData.length > 0) {
      const element = document.getElementById(`post-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });

        const params = new URLSearchParams(searchParams.toString());
        params.delete("highlight");
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [isLoading, user, postData, highlightId, router, searchParams]);

  useEffect(() => {
    const readNotifications = async () => {
      if (!fieldId) return;
      try {
        const keyToMark = highlightId ? Number(highlightId) : Number(fieldId);
        if (!keyToMark) return;
        await apiClient.put("/notification/read-notification", { key_id: keyToMark });

        console.log("Notifications marked as read for key_id:", keyToMark);
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { key_id: keyToMark },
          })
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    readNotifications();
  }, [fieldId, highlightId]);

  useEffect(() => {
    if (!fieldId) return;

    const fetchFieldData = async () => {
      try {
        sessionStorage.setItem("field_id", fieldId);
        localStorage.setItem("field_id", fieldId);

        const data = await apiClient.get(`/profile/${fieldId}`);
        setFieldData(data.data);

        sessionStorage.setItem("field_name", data.data.field_name);
        localStorage.setItem("field_name", data.data.field_name);
        const fieldOwnerId = data.data?.user_id;
        const currentUserId = user?.user_id;
        const currentUserRole = user?.role;

        if (currentUserRole === USER_ROLE.ADMIN || fieldOwnerId === currentUserId) {
          setCanPost(true);
        } else {
          setCanPost(false);
        }
        if (data.data.status !== FIELD_STATUS.VERIFIED) {
          notify(`สนามคุณ ${data.data.status}`, "error");
          setTimeout(() => {
            router.replace("/my-field");
          }, 1500);
        }
      } catch (error) {
        console.error("Error fetching field data:", error);
        if (error.status === 404) {
          setNotFoundFlag(true);
        } else {
          notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchFieldData();
  }, [fieldId, user, router, notify]);

  useEffect(() => {
    if (!fieldId) return;

    const fetchPosts = async () => {
      try {
        const data = await apiClient.get(`/posts/${fieldId}`);
        if (data.message === "ไม่มีโพส") {
          setPostData([]);
          if (highlightId) setHighlightMissing(true);
        } else {
          setPostData(data.data);
          if (highlightId) {
            const exists = data.data.some(
              (p) => String(p.post_id) === String(highlightId)
            );
            if (!exists) setHighlightMissing(true);
          }
          console.log(data.data);
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      }
    };

    fetchPosts();
  }, [fieldId, highlightId, notify]);

  useEffect(() => {
    fetchFollowing();
    fetchFollowerAll();
  }, [fetchFollowing, fetchFollowerAll]);

  // ตรวจสอบ query parameter showDescription สำหรับเปิดโมดัลคำแนะนำสนาม
  useEffect(() => {
    const showDescription = searchParams.get("showDescription");
    if (showDescription === "true") {
      setShowModalDescription(true);
      // ลบ parameter ออกจาก URL หลังจากเปิดโมดัล
      const params = new URLSearchParams(searchParams.toString());
      params.delete("showDescription");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    window.scrollTo({ top: 900, behavior: "smooth" });
  }, [currentPage]);

  const postPerPage = 5;

  const indexOfLast = currentPage * postPerPage;
  const indexOfFirst = indexOfLast - postPerPage;
  const currentPostProfile = postData.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(postData.length / postPerPage);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await apiClient.get(`/facilities/${fieldId}`);
        setFacilities(data.data);
      } catch (err) {
        console.error(err);
        notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      }
    };

    fetchFacilities();
  }, [fieldId, notify]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await apiClient.get(`/reviews/rating-previwe/${fieldId}`);
        setReviewData(data.data);
      } catch (error) {
        console.error("Error fetching review:", error);
      }
    };
    fetchReviews();
  }, [fieldId]);

  const scrollToBookingSection = () => {
    setShowSubfieldModal(true);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  const handleEdit = (post) => {
    setEditingPostId(post.post_id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setNewImages([]);
  };

  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const MAX_IMG = 10;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        notify(` ${file.name} ไม่ใช่ไฟล์รูปภาพ`, "error");
        e.target.value = null;
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        notify(`${file.name} มีขนาดใหญ่เกินไป (สูงสุด 8MB)`, "error");
        e.target.value = null;
        return;
      }
    }

    const currentPost = postData.find((p) => p.post_id === editingPostId);
    const existingImageCount = currentPost?.images?.length || 0;
    const newImageCount = files.length;

    if (existingImageCount + newImageCount > MAX_IMG) {
      notify("รวมรูปทั้งหมดต้องไม่เกิน 10 รูป (รวมรูปเดิมและรูปใหม่)", "error");
      return;
    }

    setNewImages(files);
  };

  const handleEditSubmit = async (e, postId) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("content", editContent);
    newImages.forEach((img) => formData.append("img_url", img));
    SetstartProcessLoad(true);
    try {
      const updated = await apiClient.patchForm(`/posts/update/${postId}`, formData);
      setPostData((prev) =>
        prev.map((post) => (post.post_id === postId ? updated : post))
      );
      setEditingPostId(null);
      notify("แก้ไขโพสต์สำเร็จ", "success");
      setPreviewImages([]);
    } catch (err) {
      notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };
  const confirmDelete = (postId) => {
    setPostToDelete(postId);
    setShowModal(true);
  };

  const handleDelete = async () => {
    SetstartProcessLoad(true);
    try {
      await apiClient.delete(`/posts/delete/${postToDelete}`);
      notify("ลบโพสต์เรียบร้อย", "success");
      // โพสจะถูกลบผ่าน Socket Event แล้ว ไม่ต้องลบที่นี่
      console.log("โพสถูกลบแล้ว Socket จะจัดการให้");
      setShowModal(false);
    } catch (error) {
      console.error("Delete error:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const extractLatLngFromUrl = (input) => {
    if (!input) return null;

    const cleanedInput = input.replace(/\s+/g, "");

    if (/^-?[0-9.]+,-?[0-9.]+$/.test(cleanedInput)) {
      return cleanedInput;
    }

    const match = cleanedInput.match(/([-0-9.]+),([-0-9.]+)/);
    if (match) {
      return `${match[1]},${match[2]}`;
    }

    if (
      cleanedInput.includes("maps.app.goo.gl") ||
      cleanedInput.includes("goo.gl/maps")
    ) {
      console.warn("Short URL detected - need to resolve manually");
      return null;
    }

    console.log("No coordinates found");
    return null;
  };

  const coordinates = extractLatLngFromUrl(fieldData?.gps_location);

  const getGoogleMapsLink = (gpsLocation) => {
    if (!gpsLocation) return "#";

    const cleaned = gpsLocation.replace(/\s+/g, "");

    if (cleaned.startsWith("http")) return cleaned;

    if (/^-?[0-9.]+,-?[0-9.]+$/.test(cleaned)) {
      return `https://www.google.com/maps/search/?api=1&query=${cleaned}`;
    }
    return "#";
  };

  const getLongdoMapsLink = (gpsLocation) => {
    if (!gpsLocation) return "#";

    const cleaned = gpsLocation.replace(/\s+/g, "");

    if (cleaned.startsWith("http")) return cleaned;

    if (/^-?[0-9.]+,-?[0-9.]+$/.test(cleaned)) {
      const [lat, lng] = cleaned.split(",");
      return `https://map.longdo.com/?lat=${lat}&lon=${lng}`;
    }
    return "#";
  };

  // formatPrice is imported from @/app/utils/format

  if (dataLoading) return <LoadingSpinner />;

  if (!dataLoading && notFoundFlag) {
    return (
      <NotFoundCard
        title="ไม่พบสนามนี้"
        description={
          "สนามที่คุณพยายามเข้าถึงอาจถูกลบ ปิดใช้งาน หรือไม่มีอยู่จริง\nหากมาจากการแจ้งเตือนเก่า สนามอาจถูกลบแล้ว"
        }
        primaryLabel="กลับหน้าแรก"
        onPrimary={() => router.replace("/")}
      />
    );
  }

  const handleFilterChange = (e) => {
    setSelectedRating(e.target.value);
  };

  const filteredReviews = reviewData.filter((review) => {
    if (selectedRating === "ทั้งหมด") return true;
    return review.rating === parseInt(selectedRating);
  });

  const handleCancel = () => {
    setShowSubfieldModal(false);
  };

  const clearHighlight = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");
    router.replace(`?${params.toString()}`, { scroll: false });
    setHighlightMissing(false);
  };

  const handleFollow = async () => {
    try {
      SetstartProcessLoad(true);
      await apiClient.post("/following/add-following", { fieldId: fieldId, userId: user?.user_id });
      setUserFollowing(true);
      notify("ติดตามสนามเรียบร้อย", "success");
      fetchFollowing();
      fetchFollowerAll();
    } catch (error) {
      console.error("Follow error:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const cancelFollow = async () => {
    try {
      SetstartProcessLoad(true);
      await apiClient.delete("/following/cancel-following", { fieldId, userId: user?.user_id });
      setUserFollowing(false);
      notify("เลิกติดตามสนามเรียบร้อย", "success");
      fetchFollowing();
      fetchFollowerAll();
    } catch (error) {
      console.error("Follow error:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <>
      {dataLoading && <LoadingSpinner mode="inline" />}

      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}

      {fieldData?.img_field?.length ? (
        <div className="image-container-profile">
          <div className="head-title-profile">
            <strong> {fieldData?.field_name}</strong>
          </div>
          <img
            src={`${fieldData.img_field}`}
            alt="รูปสนามกีฬา"
            className="field-image-profile"
          />

          {user &&
            (userFollowing ? (
              <button
                disabled={startProcessLoad}
                style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
                className="follow-btn-profile"
                onClick={cancelFollow}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ติดตามแล้ว"
                )}
              </button>
            ) : (
              <button
                style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
                disabled={startProcessLoad}
                className="follow-btn-profile"
                onClick={handleFollow}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ติดตาม"
                )}
              </button>
            ))}
          <div
            onClick={() => setShowModalFollower(true)}
            style={{ cursor: "pointer" }}
            className="head-subtitle-profile"
          >
            <strong>ผู้ติดตาม </strong>
            <p>{formatPrice(followers)} </p>
            <strong>คน </strong>
          </div>
        </div>
      ) : (
        <div>
          <div className="image-container-profile">
            {dataLoading && <LoadingSpinner mode="inline" />}
          </div>
        </div>
      )}
      <div className="field-detail-container-profile">
        <div className="undercontainer-proflie">
          <h1 className="sub-fields-profile">รายละเอียดสนามย่อย</h1>
          <div className="sub-fields-container-profile">
            {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
              fieldData.sub_fields.map((sub) => (
                <div
                  key={sub.sub_field_id}
                  className="sub-field-card-profile"
                  onClick={() => router.push(`/booking/${sub.sub_field_id}`)}
                >
                  <p>
                    <strong>ชื่อสนาม:</strong> {sub.sub_field_name}
                  </p>
                  <p>
                    <strong>ราคา:</strong> {formatPrice(sub.price)} บาท
                  </p>
                  <p>
                    <strong>กีฬา:</strong> {sub.sport_name}
                  </p>
                  <p>
                    <strong>จำนวนคนต่อทีม:</strong> {sub.players_per_team}
                  </p>
                  <p>
                    <strong>ความกว้างของสนาม:</strong> {sub.wid_field} เมตร
                  </p>
                  <p>
                    <strong>ความยาวของสนาม:</strong> {sub.length_field} เมตร
                  </p>
                  <p>
                    <strong>ประเภทของพื้นสนาม</strong> {sub.field_surface}
                  </p>

                  {sub.add_ons && sub.add_ons.length > 0 ? (
                    <div className="add-ons-container-profile">
                      <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                      {sub.add_ons.map((addon) => (
                        <p key={addon.add_on_id}>
                          {addon.content} - {formatPrice(addon.price)} บาท
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="no-addon-profile">
                      ไม่มีราคาสำหรับกิจกรรมพิเศษ
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="sub-fields-container-profile">
                {" "}
                {dataLoading && (
                  <div className="loading-data">
                    <div className="loading-data-spinner"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="profile-btn">
            <button onClick={scrollToBookingSection}>เลือกสนาม</button>
          </div>
          <div className="reviwe-title-profile"></div>
          <h1>รีวิวสนามกีฬา</h1>
          <select
            id="review-score"
            className="filter-profile"
            onChange={handleFilterChange}
            value={selectedRating}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>

          <div className="reviwe-container-profile">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review, index) => (
                <div
                  className="reviwe-content-profile"
                  key={review.review_id || index}
                >
                  <div className="review-box-profile">
                    <div className="user-profile-name-profile">
                      <img
                        className="user-profile-review-profile"
                        src={
                          review?.user_profile
                            ? review.user_profile
                            : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                        }
                      />
                      <strong className="review-name-profile">
                        {review.first_name} {review.last_name}
                      </strong>
                    </div>
                    <div className="review-stars-profile">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <span
                          key={num}
                          className={`star-profile ${
                            num <= review.rating ? "active" : ""
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="detail-reviwe-profile">
                    <p className="review-label">ความคิดเห็น</p>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-reviwe-content-profile">
                <div className="no-review-text">ยังไม่มีคะแนนการรีวิว</div>
              </div>
            )}
          </div>
        </div>
        <div className="post-profile">
          <h1>โพสต์</h1>
          {dataLoading && (
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          )}
          {canPost && (
            <Post
              setCurrentPage={setCurrentPage}
              fieldId={fieldId}
              onPostSuccess={(newPost) => {
                // โพสจะถูกเพิ่มผ่าน Socket Event แล้ว ไม่ต้องเพิ่มที่นี่
                console.log("โพสใหม่ถูกสร้างแล้ว Socket จะจัดการให้:", newPost);
              }}
            />
          )}
          {currentPostProfile.map((post) => (
            editingPostId === post.post_id ? (
              <PostCard
                key={post.post_id}
                post={post}
                mode="profile"
              >
                <form
                  onSubmit={(e) => handleEditSubmit(e, post.post_id)}
                  className="edit-form-post"
                >
                  <div className="form-group-profile">
                    <label>หัวข้อ</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group-profile">
                    <label>เนื้อหา</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group-profile">
                    <label className="file-label-profile">
                      <input
                        multiple
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="file-input-hidden-profile"
                      />
                      เลือกรูปภาพ
                    </label>
                  </div>
                  <div className="preview-gallery-profile">
                    {previewImages.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`Preview ${index}`}
                        className="preview-image-profile"
                      />
                    ))}
                  </div>
                  <button
                    className="savebtn-edit-post-profile"
                    type="submit"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="canbtn-post"
                    type="button"
                    onClick={() => {
                      setEditingPostId(null);
                      setPreviewImages([]);
                    }}
                  >
                    ยกเลิก
                  </button>
                </form>
              </PostCard>
            ) : (
              <PostCard
                key={post.post_id}
                post={post}
                mode="profile"
                canPost={canPost}
                onEditPost={handleEdit}
                onDeletePost={confirmDelete}
                setSelectedImage={setSelectedImage}
              />
            )
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            containerClassName="pagination-container-profile"
            activeClassName="active-page-profile"
            dotsClassName="pagination-dots-profile"
          />
        </div>

        <aside className="aside">
          <div className="field-info-profile">
            <div
              onClick={() => setShowModalDescription(true)}
              className="description-profile"
            >
              <strong>แนะนำสนาม</strong>
              <div
                className="detail-profile"
                dangerouslySetInnerHTML={{
                  __html: fieldData?.field_description || "ไม่มีข้อมูล",
                }}
              />
            </div>
            {/* <hr className="divider-hours-profile" /> */}
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            <div className="location-section-profile">
              <h1>ตำแหน่งสนาม</h1>
              <p>
                <strong>ที่อยู่:</strong> {fieldData?.address}
              </p>

              {fieldData?.gps_location ? (
                <div style={{ marginTop: "20px" }}>
                  <LongdoMapPicker
                    initialLocation={coordinates}
                    readOnly={true}
                  />
                  <a
                    href={getGoogleMapsLink(fieldData.gps_location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      width: "160px",
                      marginTop: "30px",
                      marginLeft: "auto",
                      marginRight: "auto",
                      marginBottom: "30px",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 12px",
                      backgroundColor: "#e0f2fe",
                      color: "#03045e",
                      borderRadius: "999px",
                      fontSize: "14px",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    เปิดใน GOOGLE MAP
                  </a>
                </div>
              ) : (
                <p style={{ color: "gray" }}>ไม่มีพิกัด GPS</p>
              )}
            </div>
            <div className="detail-field">
              <h1>รายละเอียดสนาม</h1>
              <p>
                <strong>วันที่เปิดสนาม</strong>
              </p>
              {fieldData?.open_days?.length > 0 ? (
                fieldData.open_days.map((day, index) => (
                  <div className="opendays" key={index}>
                    {daysInThai[day] || day}
                  </div>
                ))
              ) : (
                <div>ไม่มีข้อมูลวันเปิดสนาม</div>
              )}

              <p>
                <strong>เวลาเปิด-ปิด:</strong> {fieldData?.open_hours} -{" "}
                {fieldData?.close_hours}
              </p>
              <p>
                <strong>ยกเลิกการจองได้ก่อน: </strong>
                {fieldData?.cancel_hours} ชม.
              </p>
              <p>
                <strong>ค่ามัดจำ:</strong>{" "}
                {formatPrice(fieldData?.price_deposit)} บาท
              </p>
              <p>
                <strong>ธนาคาร:</strong> {fieldData?.name_bank}
              </p>
              <p>
                <strong>ชื่อเจ้าของบัญชี:</strong> {fieldData?.account_holder}
              </p>
              <p>
                <strong>เลขบัญชีธนาคาร:</strong> {fieldData?.number_bank}
              </p>
            </div>
            <h1 className="fac-profile">สิ่งอำนวยความสะดวก</h1>
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            <div className="field-facilities-profile">
              {Array.isArray(facilities) ? (
                facilities.length === 0 ? (
                  <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
                ) : (
                  <div className="facilities-carousel-container-profile">
                    <div className="facilities-carousel-profile">
                      {facilities.map((facility, index) => (
                        <div
                          key={`${facility.fac_id}-${index}`}
                          className="facility-card-profile-vertical"
                        >
                          <div className="facility-image-container-profile-vertical">
                            {facility.image_path ? (
                              <img
                                src={facility.image_path}
                                alt={facility.fac_name}
                                className="facility-image-profile-vertical"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="facility-no-image-profile-vertical"
                              style={{
                                display: facility.image_path ? "none" : "flex",
                              }}
                            >
                              <span>ไม่มีรูปภาพ</span>
                            </div>
                          </div>

                          <div className="facility-info-profile-vertical">
                            <h5 className="facility-name-profile-vertical">
                              {facility.fac_name}
                            </h5>
                            <p className="facility-price-profile-vertical">
                              ราคา: {formatPrice(facility.fac_price)} บาท
                            </p>
                            <p className="facility-quantity-profile-vertical">
                              จำนวนทั้งหมด: {facility.quantity_total}
                            </p>
                            <p className="facility-quantity-profile-vertical">
                              รายละเอียด: {facility.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <p style={{ color: "gray" }}>
                  ข้อมูลสิ่งอำนวยความสะดวกไม่ถูกต้อง
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
      {showModal && (
        <div className="modal-overlay-profile">
          <div className="modal-post-profile">
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?</p>
            <div className="modal-actions-post">
              <button
                className="delbtn-post"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={handleDelete}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ลบโพสต์"
                )}
              </button>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="canbtn-post"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      {showSubfieldModal && (
        <div className="modal-overlay-subfield">
          <div className="modal-box-subfield">
            <button
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              onClick={handleCancel}
              className="btn-cancel-subfield-profile"
            >
              X
            </button>
            <div className="undercontainer-proflie-overlay">
              <h1 className="sub-fields-profile">เลือกสนามย่อย</h1>
              <div className="sub-fields-container-profile-overlay">
                {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
                  fieldData.sub_fields.map((sub) => (
                    <div
                      key={sub.sub_field_id}
                      className="sub-field-card-profile-overlay"
                      onClick={() =>
                        router.push(`/booking/${sub.sub_field_id}`)
                      }
                    >
                      <p>
                        <strong>ชื่อสนาม:</strong> {sub.sub_field_name}
                      </p>
                      <p>
                        <strong>ราคา:</strong> {formatPrice(sub.price)} บาท
                      </p>
                      <p>
                        <strong>กีฬา:</strong> {sub.sport_name}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="sub-fields-container-profile">
                    {" "}
                    {dataLoading && (
                      <div className="loading-data">
                        <div className="loading-data-spinner"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showModalFollower && (
        <>
          <div className="modal-overlay-profile-follower">
            <div className="modal-post-profile-follower">
              <div className="modal-header-follower">
                <h2>ผู้ติดตาม </h2>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowModalFollower(false)}
                >
                  ×
                </button>
              </div>
              <div className="followers-list">
                {dataFollowers && dataFollowers.length > 0 ? (
                  dataFollowers.map((follower, index) => (
                    <div
                      key={follower.user_id || index}
                      className="follower-item"
                    >
                      <img
                        className="follower-avatar"
                        src={
                          follower.user_profile ||
                          "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                        }
                        alt={`${follower.first_name} ${follower.last_name}`}
                      />
                      <div className="follower-info">
                        <span className="follower-name">
                          {follower.first_name} {follower.last_name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-followers">
                    <p>ยังไม่มีผู้ติดตาม</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {showModalDescription && (
        <div className="modal-overlay-profile-follower">
          <div className="modal-post-profile-follower">
            <div className="modal-header-follower">
              <h2>แนะนำสนาม</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowModalDescription(false)}
              >
                ×
              </button>
            </div>

            <div className="field-info-section">
              {/* <h1 className="field-name-modal">{fieldData?.field_name}</h1> */}
            </div>

            <div className="field-description-content">
              <div
                className="description-text"
                dangerouslySetInnerHTML={{
                  __html:
                    fieldData?.field_description || "ไม่มีข้อมูลคำแนะนำสนาม",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

