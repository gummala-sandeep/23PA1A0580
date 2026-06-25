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


# Stage 3

### Is the given query accurate?

The query is functionally correct because it retrieves the unread notifications of a specific student and sorts them by the notification creation time. However, it is not efficient for a large dataset containing millions of notifications.

### Why is this query slow?

There are a few reasons why the query becomes slower as the data grows:

* It uses `SELECT *`, which fetches every column even though the application may only need a few fields.
* If there is no suitable index, the database performs a full table scan to find unread notifications.
* Sorting by `createdAt` becomes expensive when a large number of records need to be processed.
* As the number of notifications increases, the database has to examine more rows before returning the required results.

### What would you change?

I would make the following improvements:

* Retrieve only the required columns instead of using `SELECT *`.
* Create a composite index on `(student_id, is_read, created_at)` since these columns are used together for filtering and sorting.
* Continue using pagination so that only a limited number of notifications are returned in each request.

The improved query would be:

```sql
SELECT
    n.notification_id,
    n.title,
    n.message,
    n.notification_type,
    n.created_at
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notification_id = n.notification_id
WHERE sn.student_id = 1042
AND sn.is_read = FALSE
ORDER BY n.created_at ASC;
```

### What would be the likely computation cost?

Without a suitable index, the query performs a full table scan, resulting in approximately **O(n)** time complexity.

With a composite index on the filtering and sorting columns, the database can locate the required records much faster, reducing the lookup cost to approximately **O(log n)**.

### Is adding indexes on every column a good idea?

No.

Adding indexes to every column is not recommended. While indexes improve read performance, they also consume additional storage and slow down insert, update and delete operations because every index must be maintained.

Indexes should only be created on columns that are frequently used in filtering, sorting or joins.

### Query to find all students who received a Placement notification in the last 7 days

```sql
SELECT DISTINCT
    sn.student_id
FROM StudentNotifications sn
JOIN Notifications n
ON sn.notification_id = n.notification_id
WHERE n.notification_type = 'Placement'
AND n.created_at >= CURRENT_DATE - INTERVAL '7 days';
```

---

# Stage 4

### What solution would you suggest?

Fetching notifications from the database every time a page is loaded creates unnecessary database traffic, especially when thousands of students are using the application simultaneously.

Instead of loading all notifications on every request, I would combine pagination, caching and real-time updates to reduce database load while maintaining a good user experience.

### How would you improve performance?

I would improve the system using the following strategies:

**1. Pagination**

Return notifications in smaller batches instead of loading every notification.

**Benefit**

* Faster response time.
* Lower database load.

**Trade-off**

Users need additional requests to view older notifications.

---

**2. Caching**

Store frequently accessed information such as unread notification counts or recently viewed notifications in Redis.

**Benefit**

* Reduces repeated database queries.
* Improves response time.

**Trade-off**

Cached data may be temporarily outdated until it is refreshed.

---

**3. Real-Time Notifications**

Use WebSockets to push newly created notifications to connected users instead of repeatedly fetching data from the database.

**Benefit**

* Eliminates unnecessary polling.
* Notifications appear instantly.

**Trade-off**

Requires maintaining persistent connections, which increases implementation complexity.

---

**4. Database Indexing**

Create indexes on columns that are frequently used for filtering and sorting, such as `student_id`, `is_read` and `created_at`.

**Benefit**

* Faster query execution.

**Trade-off**

Additional storage is required, and write operations become slightly slower.

---

**5. Archive Old Notifications**

Move old notifications that are rarely accessed into an archive table.

**Benefit**

* Keeps the active notification table smaller.
* Improves query performance.

**Trade-off**

Historical notifications require a separate query if they need to be accessed.

### Which solution would I recommend?

I would use a combination of pagination, database indexing, WebSockets and caching.

Pagination reduces the amount of data returned by each request, indexing improves query performance, WebSockets deliver new notifications instantly, and caching minimizes repeated database access.

Together, these approaches significantly reduce database load while providing a faster and smoother experience for students.


