import "@napi-rs/canvas";
import app from "../dist/app.js";
import { connectDatabase } from "../dist/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error("MongoDB connection failed", error);
  }

  return app(req, res);
}
