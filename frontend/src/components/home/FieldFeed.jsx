"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSocket } from "@/app/contexts/SocketContext";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import PostCard from "@/components/post/PostCard";

export default function FieldFeed({ activeFeedTab, scrollRef }) {
  const router = useRouter();
  const { notify } = useNotification();
  const { user } = useAuth();
  const socket = useSocket();

  const [postData, setPostData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Infinite scroll event listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingMore || !hasMore || dataLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 150) {
        loadMorePosts();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [loadingMore, hasMore, dataLoading, page, activeFeedTab]);

  // Sync real-time socket events for new posts
  useEffect(() => {
    if (!socket) return;

    const handleHomeNewPost = (newPost) => {
      if (activeFeedTab !== "general") return;

      setPostData((prevPosts) => {
        if (prevPosts.some((p) => p.post_id === newPost.post_id))
          return prevPosts;
        return [newPost, ...prevPosts];
      });
    };

    const handleHomePostDeleted = (data) => {
      setPostData((prevPosts) => {
        return prevPosts.filter((post) => post.post_id !== data.postId);
      });
    };

    socket.on("home_new_post", handleHomeNewPost);
    socket.on("home_post_deleted", handleHomePostDeleted);

    return () => {
      socket.off("home_new_post", handleHomeNewPost);
      socket.off("home_post_deleted", handleHomePostDeleted);
    };
  }, [socket, activeFeedTab]);

  // Reset pagination and fetch posts when feed tab changes
  useEffect(() => {
    setPostData([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, activeFeedTab, true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeFeedTab]);

  const fetchPosts = async (targetPage, feedType, isReset = false) => {
    if (isReset) {
      setDataLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const endpoint =
        feedType === "following" ? "/posts/feed/following" : "/posts";
      const res = await apiClient.get(`${endpoint}?page=${targetPage}&limit=5`);
      const newPosts = res.data || [];

      setPostData((prev) => {
        const current = isReset ? [] : prev;
        const merged = [...current];
        newPosts.forEach((post) => {
          if (!merged.some((p) => p.post_id === post.post_id)) {
            merged.push(post);
          }
        });
        return merged;
      });

      if (newPosts.length < 5) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("Error fetching post data:", error);
      if (error.status === 404 || error.message === "ไม่มีโพส") {
        if (isReset) setPostData([]);
        setHasMore(false);
      } else {
        notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      }
    } finally {
      setDataLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, activeFeedTab, false);
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title-home")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="homepage-feed-column">
      <div className="news-section" style={{ margin: "0 auto", padding: 0 }}>
        {dataLoading && (
          <div className="news-skeleton-wrapper" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="post-card-home skeleton-post">
                <div className="skeleton-header">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line w60" />
                    <div className="skeleton-line w40" />
                  </div>
                </div>
                <div className="skeleton-line w80" />
                <div className="skeleton-media" />
                <div className="skeleton-line w90" />
                <div className="skeleton-line w50" />
                <div className="skeleton-btn w30" />
              </div>
            ))}
          </div>
        )}

        {!dataLoading && postData.length === 0 && activeFeedTab === "following" && (
          <div className="empty-feed-container">
            <div className="empty-feed-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="empty-feed-title">
              คุณยังไม่ได้ติดตามสนามใดๆ หรือสนามที่คุณติดตามยังไม่มีความเคลื่อนไหว
            </h3>
            <p className="empty-feed-description">
              ร่วมติดตามสนามกีฬาที่คุณสนใจเพื่อรับข่าวสาร กิจกรรมพิเศษ
              และโปรโมชันล่าสุดส่งตรงหน้าฟีด
            </p>
            <button
              type="button"
              className="empty-feed-action-btn"
              onClick={scrollToBookingSection}
            >
              <span>สนามที่แนะนำ</span>
            </button>
          </div>
        )}

        {!dataLoading && postData.length === 0 && activeFeedTab !== "following" && (
          <div className="empty-feed-container">
            <div className="empty-feed-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h3 className="empty-feed-title">ยังไม่มีความเคลื่อนไหวจากสนาม</h3>
            <p className="empty-feed-description">
              ขณะนี้ยังไม่มีประกาศ ข่าวสาร หรือโปรโมชันใหม่ในสนามกีฬา
              ลองกลับมาตรวจสอบอีกครั้งภายหลังนะ!
            </p>
            <button
              type="button"
              className="empty-feed-action-btn"
              onClick={scrollToBookingSection}
            >
              <span>จองสนามกีฬา</span>
            </button>
          </div>
        )}

        {!dataLoading &&
          postData.map((post) => (
            <PostCard
              key={post.post_id}
              post={post}
              mode="home"
              setSelectedImage={setSelectedImage}
              onViewPost={(p) =>
                router.push(`/profile/${p.field_id}?highlight=${p.post_id}`)
              }
            />
          ))}

        {/* Infinite Scroll loading indicator */}
        {loadingMore && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "24px",
              paddingBottom: "24px",
            }}
          >
            <span
              className="spinner"
              style={{ width: "24px", height: "24px" }}
            ></span>
          </div>
        )}
      </div>

      {/* Lightbox for zooming images */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}
    </div>
  );
}
