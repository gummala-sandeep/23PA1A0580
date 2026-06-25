import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const LOG_API = process.env.LOG_API;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

export async function Log(stack, level, packageName, message) {
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
    throw error;
  }
}