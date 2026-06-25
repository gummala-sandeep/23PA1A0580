import React, { useState, useEffect } from "react";
import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { logEvent } from "../utils/logger";

/**
 * Main page for displaying, filtering, and reloading notifications.
 * Log entries are triggered for "page opened" and "filter changed".
 */
export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const { notifications, loading, error, refresh } = useNotifications();

  // Log "page opened" on component mount
  useEffect(() => {
    logEvent("info", "page opened");
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    logEvent("info", `filter changed to: ${newFilter}`);
  };

  // Filter notifications (backend returns all sorted by priorityScore)
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "All") return true;
    return (n.type || "").toLowerCase() === filter.toLowerCase();
  });

  const highPriorityCount = notifications.filter(n => n.priorityScore >= 300).length;

  return (
    <div className="notifications-page">
      <header className="page-header">
        <div className="header-title-area">
          <div className="bell-badge-container">
            <svg className="bell-svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {highPriorityCount > 0 && <span className="bell-badge">{highPriorityCount}</span>}
          </div>
          <h1>Campus Evaluation Inbox</h1>
        </div>
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? "Syncing..." : "Sync"}
        </button>
      </header>

      <section className="filter-wrapper">
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </section>

      <main className="content-area">
        {loading && (
          <div className="state-box loading-box">
            <div className="spinner"></div>
            <p>Fetching notifications from backend...</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-box error-box">
            <h3>Sync Failed</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={refresh}>Try Again</button>
          </div>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="state-box empty-box">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>No notifications found for <strong>{filter}</strong>.</p>
          </div>
        )}

        {!loading && !error && filteredNotifications.length > 0 && (
          <div className="notifications-list">
            {filteredNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
