import React from "react";

const filters = ["All", "Placement", "Result", "Event"];

/**
 * Filter component for notifications.
 * Allows choosing between All, Placement, Result, and Event.
 */
export function NotificationFilter({ value, onChange }) {
  return (
    <div className="notification-filter-container">
      {filters.map((type) => (
        <button
          key={type}
          className={`filter-button ${value === type ? "active" : ""}`}
          onClick={() => onChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}