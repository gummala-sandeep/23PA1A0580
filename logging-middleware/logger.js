const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const LOG_API = process.env.LOG_API;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function Log(stack, level, packageName, message) {
  try {
    const response = await axios.post(
      LOG_API,
      {
        stack,
        level,
        package: packageName,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Logging failed: ${error.message}`);
    throw error;
  }
}

module.exports = { Log };