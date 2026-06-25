import React from "react";

/**
 * Renders a single notification card.
 * Shows the type, message, timestamp, and priority score.
 * Highlights high-priority notifications.
 */
export function NotificationCard({ notification }) {
  const { type, message, createdAt, priorityScore } = notification;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // High priority if score >= 300 (Placement)
  const isHighPriority = priorityScore >= 300;
  const typeLower = (type || "").toLowerCase();

  return (
    <div className={`notification-card ${isHighPriority ? "high-priority" : ""} card-${typeLower}`}>
      <div className="card-header">
        <span className={`type-badge badge-${typeLower}`}>{type}</span>
        <span className="score-badge">Score: {priorityScore}</span>
      </div>
      <div className="card-body">
        <p className="card-message">{message}</p>
      </div>
      <div className="card-footer">
        <span className="card-time">{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
