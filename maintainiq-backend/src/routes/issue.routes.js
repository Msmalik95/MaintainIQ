import express from "express";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
} from "../controllers/issue.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Public – anyone (including QR-scanned guests) can report an issue
router.post("/", createIssue);

// Protected
router.get("/", auth, getIssues);
router.get("/:id", auth, getIssueById);
router.put("/:id", auth, updateIssue);

export default router;
