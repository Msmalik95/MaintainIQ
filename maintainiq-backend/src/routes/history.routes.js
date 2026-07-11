import express from "express";
import { getHistory, getHistoryForAsset } from "../controllers/history.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getHistory);
router.get("/:assetCode", auth, getHistoryForAsset);

export default router;
