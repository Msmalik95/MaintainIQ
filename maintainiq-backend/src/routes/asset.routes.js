import express from "express";
import {
  getAssets,
  getAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset,
} from "../controllers/asset.controller.js";
import auth from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

// Public – used by the QR scan public page to look up an asset
router.get("/code/:code", getAssetByCode);

// Protected routes – require login
router.get("/", auth, getAssets);
router.post("/", auth, authorize("admin", "supervisor"), createAsset);
router.put("/:code", auth, authorize("admin", "supervisor"), updateAsset);
router.delete("/:code", auth, authorize("admin"), deleteAsset);

export default router;
