"use client";

import React from "react";
import "@/app/css/field-post.css";

/**
 * Component for triggering the Create Post Modal.
 * Used on the field profile page.
 * 
 * @param {Function} onOpenModal - Callback to open the modal from the parent.
 *   The parent is responsible for rendering the modal outside of any
 *   transformed container to avoid CSS stacking context issues.
 */
const CreatePostTrigger = ({ onOpenModal }) => {
  return (
    <div className="post-container">
      <button
        className="add-post-button"
        onClick={onOpenModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        สร้างโพสต์ใหม่
      </button>
    </div>
  );
};

export default CreatePostTrigger;
