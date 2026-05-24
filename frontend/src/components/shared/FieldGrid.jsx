"use client";

import React from "react";
import FieldCard from "@/components/field/FieldCard";
import "@/app/css/shared-grid.css";

/**
 * Reusable Field Grid component
 * @param {Array} fields - List of field objects to display
 * @param {String} mode - Display mode ('home', 'myfield', 'search')
 * @param {Function} onCardClick - Optional click handler for cards
 * @param {Function} onDelete - Optional delete handler for myfield mode
 * @param {Boolean} loading - Display skeleton if true
 * @param {Number} skeletonCount - Number of skeleton cards to show
 */
export default function FieldGrid({
  fields = [],
  mode = "home",
  onCardClick,
  onDelete,
  loading = false,
  skeletonCount = 8,
}) {
  if (loading) {
    return (
      <div className="field-grid-container skeleton-field-grid" aria-hidden="true">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={`skeleton-${i}`} className={`card-${mode === "myfield" ? "myfield" : "home"} skeleton-field`}>
            <div className="skeleton-field-img" />
            <div className="skeleton-line w70" />
            <div className="skeleton-line w50" />
            <div className="skeleton-line w60" />
            <div className="skeleton-line w40" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="field-grid-container">
      {fields.map((field, index) => (
        <FieldCard
          key={`${field.field_id}-${index}`}
          field={field}
          mode={mode}
          onClick={() => onCardClick && onCardClick(field)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
