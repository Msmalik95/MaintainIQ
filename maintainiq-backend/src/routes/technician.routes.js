import express from "express";
import { getTechnicians } from "../controllers/technician.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getTechnicians);

export default router;
