import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.routes.js";
import assetRoutes from "./routes/asset.routes.js";
import issueRoutes from "./routes/issue.routes.js";
import technicianRoutes from "./routes/technician.routes.js";
import historyRoutes from "./routes/history.routes.js";
import settingsRoutes from "./routes/settings.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
}));

// HTTP request logger
app.use(morgan("dev"));

// CORS – allow the Vite dev server and the configured frontend URL
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookies
app.use(cookieParser());

// Serve uploaded files (multer local storage fallback)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── API Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MaintainIQ Backend Running 🚀",
    version: "1.0.0",
    endpoints: [
      "POST   /api/auth/register",
      "POST   /api/auth/login",
      "GET    /api/auth/profile",
      "POST   /api/auth/logout",
      "POST   /api/auth/forgot-password",
      "POST   /api/auth/reset-password",
      "GET    /api/assets",
      "POST   /api/assets",
      "GET    /api/assets/code/:code",
      "PUT    /api/assets/:code",
      "DELETE /api/assets/:code",
      "GET    /api/issues",
      "POST   /api/issues",
      "GET    /api/issues/:id",
      "PUT    /api/issues/:id",
      "GET    /api/technicians",
      "GET    /api/history",
      "GET    /api/history/:assetCode",
      "GET    /api/settings",
      "PUT    /api/settings",
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
