"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Category from "@/app/components/SportType";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import { createSocket, logSocketError } from "@/app/lib/socket";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [postData, setPostData] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [carouselProgress, setCarouselProgress] = useState(0); 
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const socketRef = useRef(null);

  // Socket connection สำหรับ real-time updates
  useEffect(() => {
    const socket = createSocket(API_URL);
    if (!socket) return;
    console.log("Home Socket initialized:", socket);
    socketRef.current = socket;
    
    socket.on("connect", () => {
      console.log("Home Socket connected:", socket.id);
    });

    // รับฟัง Socket Event สำหรับโพสใหม่
    socket.on("home_new_post", (newPost) => {
      console.log("=== HOME NEW POST EVENT RECEIVED ===");
      console.log("Received new post for home:", newPost);
      
      setPostData((prevPosts) => {
        // เพิ่มโพสใหม่ลงในด้านบนสุด และจำกัดให้แสดงแค่ 5 โพส (ตาม LIMIT ใน backend)
        const updatedPosts = [newPost, ...prevPosts].slice(0, 5);
        console.log("Updated home posts count:", updatedPosts.length);
        return updatedPosts;
      });
    });

    // รับฟัง Socket Event สำหรับการลบโพส
    socket.on("home_post_deleted", (data) => {
      console.log("=== HOME POST DELETED EVENT RECEIVED ===");
      console.log("Post to delete from home:", data.postId);
      
      setPostData((prevPosts) => {
        const filteredPosts = prevPosts.filter((post) => post.post_id !== data.postId);
        console.log("Home posts after deletion:", filteredPosts.length);
        
        // ถ้าโพสถูกลบจนเหลือน้อยกว่า 5 โพส ให้ fetch โพสเพิ่ม
        if (filteredPosts.length < 5) {
          setTimeout(() => {
            fetchPosts();
          }, 1000);
        }
        return filteredPosts;
      });
    });

    socket.on("connect_error", (err) => {
      logSocketError("Home", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_URL}/posts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (data.message === "ไม่มีโพส") {
          setPostData([]);
        } else if (res.ok) {
          setPostData(data.data);
          console.log(data.data);
        } else {
          console.error("Backend error:", data.error);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.error);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

  useEffect(() => {
    fetchPosts();
  }, []);

  const ROTATION_MS = 15000;
  const TICK_MS = 100; 

  const handlePrev = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]:
        (prev[postId] || 0) - 1 < 0 ? length - 1 : (prev[postId] || 0) - 1,
    }));
    setCarouselProgress(0);
  };

  const handleNext = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1 >= length ? 0 : (prev[postId] || 0) + 1,
    }));
    setCarouselProgress(0);
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title-home")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  useEffect(() => {
    if (!postData || postData.length === 0) return;
    const interval = setInterval(() => {
      setCarouselProgress((prev) => {
        const next = prev + TICK_MS;
        if (next >= ROTATION_MS) {
            setImageIndexes((prevIndexes) => {
            const updated = { ...prevIndexes };
            postData.forEach((post) => {
              const total = post.images?.length || 0;
              if (total > 1) {
                const current = prevIndexes[post.post_id] || 0;
                updated[post.post_id] = (current + 1) % total;
              }
            });
            return updated;
          });
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [postData]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
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
        <div className="news-section">
          <div className="title-notice">
            <h1>ประกาศ</h1>
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
          {!dataLoading && postData.map((post) => (
            <div key={post.post_id} className="post-card-home">
              <div className="inline-name-field">
                <img
                  src={
                    post.img_field
                      ? `${post.img_field}`
                      : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
                  }
                  alt={post.field_name}
                  className="post-img-field-home"
                />
                <div className="field-name-created-at-home">
                  <h2 className="post-field-name-home">{post.field_name}</h2>
                  <div className="time-home">
                    {dayjs(post.created_at).fromNow()}
                  </div>
                </div>
              </div>
              <h2 className="post-title-home">{post.content}</h2>

              {post.images && post.images.length > 0 && (
                <div className="ig-carousel-container-home">
                  <div className="ig-carousel-track-wrapper-home">
                    <div className="ig-carousel-track-home">
                      <img
                        key={`img-${post.post_id}-$${imageIndexes[post.post_id] || 0}`}
                        src={`${post.images[imageIndexes[post.post_id] || 0].image_url}`}
                        alt="รูปโพสต์"
                        className="ig-carousel-image-home fade-swap"
                      />
                    </div>
                    {post.images.length > 1 && (
                      <div className="carousel-progress" aria-hidden="true">
                        <div
                          className="carousel-progress-bar"
                          style={{ width: `${(carouselProgress / ROTATION_MS) * 100}%` }}
                        />
                      </div>
                    )}
                    <button
                      className="arrow-btn left-home"
                      onClick={() =>
                        handlePrev(post.post_id, post.images.length)
                      }
                    >
                      ❮
                    </button>
                    <button
                      className="arrow-btn right-home"
                      onClick={() =>
                        handleNext(post.post_id, post.images.length)
                      }
                    >
                      ❯
                    </button>
                  </div>
                  <div className="dot-indicators-home">
                    {post.images.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`dot-home ${
                          (imageIndexes[post.post_id] || 0) === dotIdx
                            ? "active-home"
                            : ""
                        }`}
                        onClick={() =>
                          setImageIndexes((prev) => ({
                            ...prev,
                            [post.post_id]: dotIdx,
                          }))
                        }
                      ></span>
                    ))}
                  </div>
                </div>
              )}

              {post.title.length > 100 ? (
                <p className="post-text-home">
                  {expandedPosts[post.post_id]
                    ? post.title
                    : `${post.title.substring(0, 100).trim()}... `}
                  <span
                    onClick={() => toggleExpanded(post.post_id)}
                    className="see-more-button-home"
                  >
                    {expandedPosts[post.post_id] ? "ย่อ" : "ดูเพิ่มเติม"}
                  </span>
                </p>
              ) : (
                <p className="post-text-home">{post.title}</p>
              )}

              <button
                type="button"
                className="view-post-btn-home"
                onClick={() =>
                  router.push(
                    `/profile/${post.field_id}?highlight=${post.post_id}`
                  )
                }
              >
                ดูโพสต์
              </button>
            </div>
          ))}
        </div>
        <Category></Category>
      </div>
    </>
  );
}
