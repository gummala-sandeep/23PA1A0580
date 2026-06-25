# Notification System Design

## Stage 1 – REST API Design

The notification system should allow students to receive notifications, view them, filter them based on type, and manage their read status. The APIs below are designed to keep the communication between the frontend and backend simple and scalable.

---

### Get All Notifications

**Endpoint**

```http
GET /notifications
```

This API returns the notifications available for the authenticated student.

**Headers**

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Query Parameters**

* `page` – Current page number.
* `limit` – Number of notifications to return.
* `type` – Optional filter (Placement, Result or Event).
* `unreadOnly` – Optional flag to fetch only unread notifications.

**Sample Response**

```json
{
  "page": 1,
  "limit": 10,
  "total": 52,
  "notifications": [
    {
      "id": "N101",
      "title": "Placement Drive",
      "message": "ABC Technologies recruitment starts tomorrow.",
      "type": "Placement",
      "isRead": false,
      "createdAt": "2026-06-25T09:30:00Z"
    }
  ]
}
```

---

### Get Notification Details

**Endpoint**

```http
GET /notifications/{notificationId}
```

Returns complete information about a particular notification.

---

### Mark Notification as Read

**Endpoint**

```http
PATCH /notifications/{notificationId}/read
```

Updates the read status of a notification.

**Response**

```json
{
    "message": "Notification marked as read."
}
```

---

### Mark All Notifications as Read

**Endpoint**

```http
PATCH /notifications/read-all
```

Marks every unread notification of the logged-in student as read.

---

### Get Unread Notification Count

**Endpoint**

```http
GET /notifications/unread-count
```

Returns the number of unread notifications.

**Response**

```json
{
    "count": 7
}
```

---

### Error Responses

The APIs should return appropriate HTTP status codes.

* **200** – Request completed successfully.
* **400** – Invalid request.
* **401** – User is not authenticated.
* **404** – Notification not found.
* **500** – Internal server error.

---

### Real-Time Notification Delivery

The application should support real-time notifications using **WebSockets**. Whenever a new notification is generated, the backend pushes it directly to connected students without requiring them to refresh the page.

If a WebSocket connection is unavailable, the frontend can periodically check for new notifications using polling.

---

