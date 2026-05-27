"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSocket } from "@/app/contexts/SocketContext";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import Category from "@/components/admin/SportType";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import PostCard from "@/components/post/PostCard";
import { USER_STATUS } from "@/constants/status";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function HomePage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [postData, setPostData] = useState([]);
  const { user, isLoading } = useAuth();
  const socket = useSocket();
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const handleHomeNewPost = (newPost) => {
      console.log("=== HOME NEW POST EVENT RECEIVED ===");
      console.log("Received new post for home:", newPost);

      setPostData((prevPosts) => {
        const updatedPosts = [newPost, ...prevPosts].slice(0, 5);
        console.log("Updated home posts count:", updatedPosts.length);
        return updatedPosts;
      });
    };

    const handleHomePostDeleted = (data) => {
      console.log("=== HOME POST DELETED EVENT RECEIVED ===");
      console.log("Post to delete from home:", data.postId);

      setPostData((prevPosts) => {
        const filteredPosts = prevPosts.filter(
          (post) => post.post_id !== data.postId,
        );
        console.log("Home posts after deletion:", filteredPosts.length);

        if (filteredPosts.length < 5) {
          setTimeout(() => {
            fetchPosts();
          }, 1000);
        }
        return filteredPosts;
      });
    };

    socket.on("home_new_post", handleHomeNewPost);
    socket.on("home_post_deleted", handleHomePostDeleted);

    return () => {
      socket.off("home_new_post", handleHomeNewPost);
      socket.off("home_post_deleted", handleHomePostDeleted);
    };
  }, [socket]);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiClient.get("/posts");
      if (data.message === "ไม่มีโพส") {
        setPostData([]);
      } else {
        setPostData(data.data);
        console.log(data.data);
      }
    } catch (error) {
      console.error("Error fetching post data:", error);
      if (error.status !== 404) {
        notify(error.message || "ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", "error");
      } else {
        setPostData([]);
      }
    } finally {
      setDataLoading(false);
    }
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title-home")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="banner-container">
        <img
          src="/images/baner-img.png"
          alt="ศูนย์กีฬา"
          className="banner-video"
        />

        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="home-btn">
            <button onClick={scrollToBookingSection}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <Category></Category>

        <div className="news-section">
          <div className="title-notice">
            <span className="section-badge">News & Updates</span>
            <h1>ความเคลื่อนไหวและโปรโมชัน</h1>
            <p className="section-subtitle">
              ติดตามข่าวสาร กิจกรรมพิเศษ และโปรโมชันล่าสุดส่งตรงจากสนามกีฬาที่คุณสนใจ
            </p>
          </div>
          {dataLoading && (
            <div className="news-skeleton-wrapper" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
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
          {!dataLoading &&
            postData.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                mode="home"
                onViewPost={(p) =>
                  router.push(`/profile/${p.field_id}?highlight=${p.post_id}`)
                }
              />
            ))}
        </div>
      </div>
    </>
  );
}
