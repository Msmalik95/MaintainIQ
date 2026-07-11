import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import auth from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", auth, getSettings);
router.put("/", auth, authorize("admin"), updateSettings);

export default router;
