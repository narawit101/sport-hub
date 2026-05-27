"use client";

import React from "react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  containerClassName = "pagination-container",
  activeClassName = "active",
  dotsClassName = "pagination-dots",
  buttonClassName = "pagination-btn",
}) {
  const getPaginationRange = (current, total) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let j;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (j) {
        if (i - j === 2) {
          rangeWithDots.push(j + 1);
        } else if (i - j > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      j = i;
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={containerClassName}>
      <button
        className={`${buttonClassName} pagination-nav-btn`}
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        ‹
      </button>

      {getPaginationRange(currentPage, totalPages).map((page, index) =>
        page === "..." ? (
          <span key={index} className={dotsClassName}>
            ...
          </span>
        ) : (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`${buttonClassName} ${page === currentPage ? activeClassName : ""}`}
          >
            {page}
          </button>
        )
      )}

      <button
        className={`${buttonClassName} pagination-nav-btn`}
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
      >
        ›
      </button>
    </div>
  );
}
