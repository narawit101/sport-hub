import React from "react";

export default function ReviewModal({
  showReviewModal,
  handleCloseReviewModal,
  rating,
  setRating,
  comment,
  setComment,
  handleSubmitReview,
  startProcessLoad,
}) {
  if (!showReviewModal) return null;

  return (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2 className="review-title-detail">เขียนรีวิว</h2>
          <button className="close-modal-btn" onClick={handleCloseReviewModal}>
            ✕
          </button>
        </div>
        <div className="review-inline-wrapper-detail" style={{ border: 'none', boxShadow: 'none', marginTop: 0 }}>
          <div className="rating-input-detail">
            <p>คะแนนความพึงพอใจ:</p>
            <div className="stars-detail">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= rating ? "star-detail active" : "star-detail"}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="comment-input-detail">
            <p>ความคิดเห็น:</p>
            <textarea
              className="review-textarea-detail"
              placeholder="เขียนความประทับใจ หรือข้อเสนอแนะของคุณที่นี่..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
        <div className="review-buttons-detail">
          <button
            className="review-submit-btn"
            onClick={handleSubmitReview}
            disabled={startProcessLoad}
          >
            {startProcessLoad ? "กำลังบันทึก..." : "ส่งรีวิว"}
          </button>
          <button
            className="review-cancel-btn"
            onClick={handleCloseReviewModal}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
