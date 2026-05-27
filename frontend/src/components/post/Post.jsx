"use client";

import React, { useState } from "react";
import "@/app/css/field-post.css";
import PostModal from "./PostModal";

/**
 * Component for triggering the Create Post Modal.
 * Used on the field profile page.
 */
const CreatePostTrigger = ({ fieldId, onPostSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="post-container">
        <button
          className="add-post-button"
          onClick={() => setIsModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          สร้างโพสต์ใหม่
        </button>
      </div>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
        fieldId={fieldId}
        onSuccess={onPostSuccess}
      />
    </>
  );
};

export default CreatePostTrigger;
