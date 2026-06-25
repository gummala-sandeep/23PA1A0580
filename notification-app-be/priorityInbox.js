const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { Log } = require("logging-middleware");

dotenv.config();

const AFFORD_TOKEN = process.env.AFFORD_TOKEN;
const PORT = process.env.PORT || 5001;

/**
 * Calculates priority score for a notification.
 * Rules:
 * 1. Placement > Result > Event
 * 2. Within the same type, newer notifications should rank higher.
 * 
 * We use base scores: Placement = 300, Result = 200, Event = 100.
 * We add the hours elapsed since 2026-01-01 to ensure newer notifications rank higher.
 */
function calculatePriorityScore(notification) {
  let baseScore = 0;
  const type = (notification.type || "").toLowerCase();
  
  if (type === "placement") {
    baseScore = 300;
  } else if (type === "result") {
    baseScore = 200;
  } else if (type === "event") {
    baseScore = 100;
  }

  // To guarantee no category overlaps, the time offset must not exceed the category gap (100).
  // We use a fixed epoch of 2026-01-01T00:00:00Z.
  // We scale the elapsed time so that it is between 0 and 99.9999 for a span of 10 years.
  const epoch = new Date("2026-01-01T00:00:00Z").getTime();
  const createdTime = new Date(notification.createdAt || notification.created_at || Date.now()).getTime();
  const tenYearsInMs = 10 * 365.25 * 24 * 60 * 60 * 1000;
  
  // Bounded between 0 and 1
  const timeOffset = Math.max(0, Math.min(1, (createdTime - epoch) / tenYearsInMs));
  const timeScore = timeOffset * 99; // Bounded between 0 and 99

  return parseFloat((baseScore + timeScore).toFixed(4));
}

/**
 * Returns only the top 10 notifications sorted by priority.
 */
function getTopPriorityNotifications(notifications) {
  const prioritized = notifications.map(n => {
    const score = calculatePriorityScore(n);
    return {
      ...n,
      priorityScore: score
    };
  });

  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
  return prioritized.slice(0, 10);
}

/**
 * Stage 6 Utility function to fetch, rank, log, and print notifications.
 */
async function runUtility() {
  try {
    await Log("backend", "info", "notification-app-be", "execution started");

    if (!AFFORD_TOKEN || AFFORD_TOKEN.includes("placeholder")) {
      console.warn("WARNING: AFFORD_TOKEN is not set or is using a placeholder. The utility fetch may fail.");
    }

    await Log("backend", "info", "notification-app-be", "API request started");
    
    const response = await axios.get("http://4.224.186.213/evaluation-service/notifications", {
      headers: {
        Authorization: `Bearer ${AFFORD_TOKEN}`
      }
    });

    await Log("backend", "info", "notification-app-be", "API success");

    const notifications = response.data;
    if (!Array.isArray(notifications)) {
      throw new Error("Invalid API response: Expected an array of notifications");
    }

    const top10 = getTopPriorityNotifications(notifications);
    await Log("backend", "info", "notification-app-be", "ranking completed");

    console.log("\n=== TOP 10 PRIORITY NOTIFICATIONS ===");
    top10.forEach((n, index) => {
      const type = n.type || n.notification_type || "Unknown";
      const msg = n.message || n.title || "No Message";
      const date = n.createdAt || n.created_at || "No Date";
      console.log(`${index + 1}. [${type}] (Score: ${n.priorityScore}) - ${msg} (${date})`);
    });
    console.log("=====================================\n");

    await Log("backend", "info", "notification-app-be", "execution completed");
    return top10;
  } catch (error) {
    const errorMsg = error.response ? `${error.message} - ${JSON.stringify(error.response.data)}` : error.message;
    console.error(`Error executing utility: ${errorMsg}`);
    try {
      await Log("backend", "error", "notification-app-be", `failures: ${errorMsg}`);
    } catch (logErr) {
      console.error(`Logging failed: ${logErr.message}`);
    }
    return [];
  }
}

// Setup Express server to serve notifications to the React frontend
const app = express();
app.use(cors());
app.use(express.json());

app.get("/notifications", async (req, res) => {
  try {
    await Log("backend", "info", "notification-app-be", "HTTP client requesting notifications");
    
    const response = await axios.get("http://4.224.186.213/evaluation-service/notifications", {
      headers: {
        Authorization: `Bearer ${AFFORD_TOKEN}`
      }
    });

    const notifications = response.data;
    if (!Array.isArray(notifications)) {
      return res.status(500).json({ error: "Invalid API response from evaluation service" });
    }

    const prioritized = notifications.map(n => {
      const score = calculatePriorityScore(n);
      return {
        id: n.id || n.notification_id || Math.random().toString(),
        type: n.type || n.notification_type || "Unknown",
        message: n.message || n.title || "No Message",
        createdAt: n.createdAt || n.created_at || new Date().toISOString(),
        priorityScore: score
      };
    });

    // Sort by priorityScore descending
    prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({ notifications: prioritized });
  } catch (error) {
    const errorMsg = error.response ? `${error.message} - ${JSON.stringify(error.response.data)}` : error.message;
    console.error(`Error in GET /notifications endpoint: ${errorMsg}`);
    res.status(500).json({ error: "Failed to fetch notifications from evaluation service" });
  }
});

// Run utility and start server
runUtility().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});

module.exports = {
  calculatePriorityScore,
  getTopPriorityNotifications
};
