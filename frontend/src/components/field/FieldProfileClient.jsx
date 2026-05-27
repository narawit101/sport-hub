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
import PostModal from "@/components/post/PostModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LongdoMapPicker from "@/components/shared/LongdoMapPicker";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, USER_ROLE, FIELD_STATUS } from "@/constants/status";

import FieldHeader from "@/components/field/FieldHeader";

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPostData, setEditingPostData] = useState(null);

  // Create Modal State (kept at root level to avoid CSS transform stacking context issues)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
  const [userFollowing, setUserFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [dataFollowers, setDataFollowers] = useState([]);
  const socket = useSocket();
  const [sortOrder, setSortOrder] = useState("latest");
  const [filterDate, setFilterDate] = useState("");

  const fetchFollowing = useCallback(async () => {
    if (!user?.user_id || !fieldId) return;
    try {
      const data = await apiClient.get(
        `/following/get-following/${user.user_id}/${fieldId}`,
      );
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
            (post) => post.post_id !== data.postId,
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
        await apiClient.put("/notification/read-notification", {
          key_id: keyToMark,
        });

        console.log("Notifications marked as read for key_id:", keyToMark);
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { key_id: keyToMark },
          }),
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

        if (
          currentUserRole === USER_ROLE.ADMIN ||
          fieldOwnerId === currentUserId
        ) {
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
          notify(
            error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            "error",
          );
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
              (p) => String(p.post_id) === String(highlightId),
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

  useEffect(() => {
    const showDescription = searchParams.get("showDescription");
    if (showDescription === "true") {
      setShowModalDescription(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("showDescription");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    window.scrollTo({ top: 900, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder, filterDate]);

  const processedPosts = (() => {
    let result = [...postData];

    // 1. Filter by Date
    if (filterDate) {
      result = result.filter((post) => {
        const postDateStr = dayjs(post.created_at).format("YYYY-MM-DD");
        return postDateStr === filterDate;
      });
    }

    // 2. Sort
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  })();

  const postPerPage = 5;

  const indexOfLast = currentPage * postPerPage;
  const indexOfFirst = indexOfLast - postPerPage;
  const currentPostProfile = processedPosts.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(processedPosts.length / postPerPage);

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

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  const handleEdit = (post) => {
    setEditingPostData(post);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedPost) => {
    setPostData((prev) =>
      prev.map((post) => (post.post_id === updatedPost.post_id ? updatedPost : post)),
    );
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

  const clearHighlight = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");
    router.replace(`?${params.toString()}`, { scroll: false });
    setHighlightMissing(false);
  };

  const handleFollow = async () => {
    try {
      SetstartProcessLoad(true);
      await apiClient.post("/following/add-following", {
        fieldId: fieldId,
        userId: user?.user_id,
      });
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
      await apiClient.delete("/following/cancel-following", {
        fieldId,
        userId: user?.user_id,
      });
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

      {/* Create Post Modal — rendered at root level to avoid CSS transform stacking context issues
          from .post-profile:hover { transform: translateY(-2px) } */}
      <PostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        fieldId={fieldId}
        onSuccess={(newPost) => {
          console.log("โพสใหม่ถูกสร้างแล้ว Socket จะจัดการให้:", newPost);
        }}
      />

      <FieldHeader
        fieldData={fieldData}
        followersCount={followers}
        isFollowing={userFollowing}
        onFollow={handleFollow}
        onUnfollow={cancelFollow}
        onShowFollowers={() => setShowModalFollower(true)}
        showFollowAction={!!user}
        startProcessLoad={startProcessLoad}
        onImageClick={setSelectedImage}
      />
      <div className="field-detail-container-profile">
        <div className="profile-main-content">
          {/* แนะนำสนาม */}
          <div
            className="description-profile-box"
            onClick={() => setShowModalDescription(true)}
            style={{ cursor: "pointer" }}
          >
            <div className="description-header-profile">
              <h1>แนะนำสนาม</h1>
              <span className="view-more-text">ดูเพิ่มเติม</span>
            </div>
            <div
              className="detail-profile-content"
              dangerouslySetInnerHTML={{
                __html: fieldData?.field_description || "ไม่มีข้อมูลคำแนะนำสนาม",
              }}
            />
          </div>

          {/* รายละเอียดสนามย่อย */}
          <div className="undercontainer-profile">
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
          </div>

          {/* โพสต์ล่าสุดจากสนาม */}
          <div className="post-profile">
            <h1>โพสต์และประกาศ</h1>
            {postData.length > 0 && (
              <div className="post-filter-bar">
                <div className="post-filter-item">
                  <label htmlFor="post-sort">เรียงลำดับ:</label>
                  <select
                    id="post-sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="post-filter-select"
                  >
                    <option value="latest">ล่าสุด</option>
                    <option value="oldest">เก่าสุด</option>
                  </select>
                </div>

                <div className="post-filter-item">
                  <label htmlFor="post-date">วันที่โพสต์:</label>
                  <div className="post-date-input-wrapper">
                    <input
                      type="date"
                      id="post-date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="post-filter-date"
                    />
                    {filterDate && (
                      <button
                        type="button"
                        onClick={() => setFilterDate("")}
                        className="clear-date-btn"
                        title="ล้างตัวกรองวันที่"
                      >
                        ล้าง
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            {canPost && (
              <Post
                onOpenModal={() => setIsCreateModalOpen(true)}
              />
            )}
            {!dataLoading && postData.length === 0 && (
              <div className="empty-post-container">
                <div className="empty-post-icon-wrapper">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="empty-post-title">ยังไม่มีโพสต์หรือประกาศ</h3>
                <p className="empty-post-description">
                  สนามยังไม่มีการเคลื่อนไหวหรือประกาศข่าวสารในขณะนี้
                </p>
              </div>
            )}
            {!dataLoading && postData.length > 0 && processedPosts.length === 0 && (
              <div className="empty-post-container">
                <div className="empty-post-icon-wrapper">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="empty-post-title">ไม่พบโพสต์ที่คุณค้นหา</h3>
                <p className="empty-post-description">
                  ไม่พบประกาศตามตัวเลือกที่เลือก ลองล้างตัวกรองเพื่อดูโพสต์ทั้งหมด
                </p>
                {filterDate && (
                  <button
                    type="button"
                    className="empty-post-action-btn"
                    onClick={() => setFilterDate("")}
                  >
                    ล้างตัวกรองวันที่
                  </button>
                )}
              </div>
            )}
            {currentPostProfile.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                mode="profile"
                canPost={canPost}
                onEditPost={handleEdit}
                onDeletePost={confirmDelete}
                setSelectedImage={setSelectedImage}
              />
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

          {/* รีวิวสนามกีฬา */}
          <div className="reviews-section-profile">
            <div className="reviews-header-profile">
              <h1>รีวิวสนามกีฬา</h1>
              <div className="reviews-filter-wrapper">
                <label htmlFor="review-score">คะแนน:</label>
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
              </div>
            </div>

            <div className="review-container-profile">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review, index) => (
                  <div
                    className="review-content-profile"
                    key={review.review_id || index}
                  >
                    <div className="review-item-header">
                      <div className="review-user-info">
                        <img
                          className="user-profile-review-profile"
                          src={
                            review?.user_profile
                              ? review.user_profile
                              : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                          }
                          alt="รีวิว"
                        />
                        <div className="review-user-details">
                          <strong className="review-name-profile">
                            {review.first_name} {review.last_name}
                          </strong>
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
                      </div>
                    </div>
                    <div className="detail-review-profile">
                      <p className="review-label">ความคิดเห็น</p>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-review-container">
                  <div className="empty-review-icon-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <line x1="9" y1="10" x2="15" y2="10" />
                      <line x1="12" y1="7" x2="12" y2="13" />
                    </svg>
                  </div>
                  <h3 className="empty-review-title">ยังไม่มีรีวิวสำหรับสนามนี้</h3>
                  <p className="empty-review-description">
                    คุณสามารถเป็นคนแรกที่ให้รีวิวหลังจากจองและเข้าใช้สนามแล้ว
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="profile-sidebar">
          {/* ตำแหน่งสนาม */}
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
                  className="open-google-maps-btn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  เปิดใน GOOGLE MAP
                </a>
              </div>
            ) : (
              <p style={{ color: "gray" }}>ไม่มีพิกัด GPS</p>
            )}
          </div>

          {/* รายละเอียดสนาม */}
          <div className="detail-field">
            <h1>รายละเอียดสนาม</h1>
            <p>
              <strong>วันที่เปิดสนาม</strong>
            </p>
            {fieldData?.open_days?.length > 0 ? (
              [...fieldData.open_days]
                .sort(
                  (a, b) =>
                    [
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].indexOf(a) -
                    [
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].indexOf(b)
                )
                .map((day, index) => (
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

          {/* สิ่งอำนวยความสะดวก */}
          <div className="facilities-section-profile">
            <h1 className="fac-profile">สิ่งอำนวยความสะดวก</h1>
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
            <div className="field-facilities-profile">
              {Array.isArray(facilities) ? (
                facilities.length === 0 ? (
                  <p className="no-facilities">ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
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
                              จำนวนทั้งหมด: {facility.quantity_total} ชิ้น
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
      {showModalFollower && (
        <>
          <div
            className="modal-overlay-profile-follower"
            onClick={() => setShowModalFollower(false)}
          >
            <div
              className="modal-post-profile-follower"
              onClick={(e) => e.stopPropagation()}
            >
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
        <div
          className="modal-overlay-profile-follower"
          onClick={() => setShowModalDescription(false)}
        >
          <div
            className="modal-post-profile-follower"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-follower">
              <h2>แนะนำสนาม</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowModalDescription(false)}
              >
                ×
              </button>
            </div>

            <div className="field-info-section"></div>

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

      {/* Edit Post Modal */}
      <PostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        fieldId={fieldId}
        postData={editingPostData}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
