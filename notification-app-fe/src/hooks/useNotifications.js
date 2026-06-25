import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { logEvent } from "../utils/logger";

/**
 * Custom hook to fetch and manage notifications.
 * Handles loading, error, and logging.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await logEvent("info", "notifications fetch started");
      const data = await fetchNotifications();
      const list = data.notifications || [];
      setNotifications(list);
      await logEvent("info", `notifications fetched successfully (${list.length} items)`);
    } catch (err) {
      const errMsg = err.message || "Unknown error";
      setError(errMsg);
      await logEvent("error", `notifications fetch failed: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { notifications, loading, error, refresh: load };
}
