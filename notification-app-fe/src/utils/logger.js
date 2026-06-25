/**
 * Logger utility for the React frontend.
 * Replicates the behavior of the shared logging middleware but runs in the browser.
 */
export async function logEvent(level, message) {
  try {
    const logApi = process.env.LOG_API;
    const accessToken = process.env.ACCESS_TOKEN;

    if (!logApi) {
      console.warn("LOG_API is not defined. Skipping remote log.");
      return;
    }

    const payload = {
      stack: "frontend",
      level: level || "info",
      package: "notification-app-fe",
      message: message
    };

    console.log(`[FE LOG - ${level.toUpperCase()}] ${message}`);

    const response = await fetch(logApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Logging API returned status: ${response.status}`);
    }
  } catch (error) {
    console.error("Logging failed:", error.message);
  }
}
