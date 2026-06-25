/**
 * Fetches prioritized notifications from the backend server.
 */
export async function fetchNotifications() {
  const response = await fetch("http://localhost:5001/notifications");
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
