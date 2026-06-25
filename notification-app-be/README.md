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

# Stage 2 – Database Design

## Database Choice

For this application, I chose **PostgreSQL** as the primary database.

The notification system stores structured data where students receive multiple notifications and every notification maintains an individual read status for each student. PostgreSQL handles these relationships efficiently and provides good support for filtering, sorting, indexing and pagination.

---

## Database Structure

### Students

Stores the details of every student.

Fields:

* `student_id (UUID)` – Unique identifier.
* `name (VARCHAR)` – Student name.
* `email (VARCHAR)` – Student email.

---

### Notifications

Stores the notification content.

Fields:

* `notification_id (UUID)` – Unique identifier.
* `title (VARCHAR)` – Notification title.
* `message (TEXT)` – Notification content.
* `notification_type (ENUM)` – Placement, Result or Event.
* `created_at (TIMESTAMP)` – Time when the notification was created.

---

### StudentNotifications

Stores the relationship between students and notifications.

This table also keeps track of whether a student has read a notification.

Fields:

* `id (UUID)` – Primary key.
* `student_id (UUID)` – References Students.
* `notification_id (UUID)` – References Notifications.
* `is_read (BOOLEAN)` – Read status.
* `read_at (TIMESTAMP)` – Time when the notification was read.

---

## Why this Design?

A single notification may be delivered to many students. Instead of storing the same notification multiple times, the notification information is stored only once and linked to students through the `StudentNotifications` table.

This keeps the database normalized, reduces duplicate data and allows every student to maintain an independent read status.

---

## Challenges as Data Grows

As the application becomes popular, the notification table will continue growing.

Possible challenges include:

* Slower notification retrieval.
* Increased query execution time.
* Slower sorting when ordering by creation time.
* Higher storage requirements.
* Reduced performance during peak notification periods.

---

## Improving Scalability

To maintain good performance, the following improvements can be made:

* Create indexes on columns that are frequently searched.
* Use pagination while fetching notifications.
* Archive old notifications that are no longer frequently accessed.
* Partition notification data if the table becomes very large.
* Cache frequently requested values such as unread notification counts.

---

## Sample Queries

### Fetch notifications for a student

```sql
SELECT n.notification_id,
       n.title,
       n.message,
       n.notification_type,
       sn.is_read,
       n.created_at
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notification_id = n.notification_id
WHERE sn.student_id = :studentId
ORDER BY n.created_at DESC
LIMIT :limit OFFSET :offset;
```

---

### Mark a notification as read

```sql
UPDATE StudentNotifications
SET is_read = TRUE,
    read_at = CURRENT_TIMESTAMP
WHERE student_id = :studentId
AND notification_id = :notificationId;
```

---

### Get unread notification count

```sql
SELECT COUNT(*)
FROM StudentNotifications
WHERE student_id = :studentId
AND is_read = FALSE;
```

---

### Filter notifications by type

```sql
SELECT n.notification_id,
       n.title,
       n.message,
       n.notification_type,
       sn.is_read,
       n.created_at
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notification_id = n.notification_id
WHERE sn.student_id = :studentId
AND n.notification_type = :type
ORDER BY n.created_at DESC;
```


