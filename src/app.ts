import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db";

import courseRoutes from "./routes/course";
import unitRoutes from "./routes/unit";
import userRoutes from "./routes/user";
import noteRoutes from "./routes/note";
import scheduleRoutes from "./routes/schedule";
import pleaRoutes from "./routes/plea";
import qrRoutes from "./routes/qr";
import accessRoutes from "./routes/access";

import { initApp } from "./config/setup";
import { intro } from "./config/banners";
import path from "path";
import { encrypt } from "./utils/security";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: [
  "http://localhost:5173", "https://attendance-management-system-client.onrender.com"
], 
credentials: true }));
app.use("/api/notes/pdf", express.static(path.join(__dirname, "assets/notes/pdf")));
app.use("/api/plea-src", express.static(path.join(__dirname, "assets/plea")));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/access", accessRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/pleas", pleaRoutes);
app.use("/api/qr", qrRoutes);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    return res.status(404).json(encrypt({ message: "Request not supported." }));
  }
  next();
});

connectDB().then(async () => {
  try {
    await initApp();
    app.listen(PORT, () => {
      console.log(intro(Number(PORT), "Production"));
    });
  } catch (err) {
    console.error("❌ Initialization failed:", err);
    process.exit(1);
  }

});

