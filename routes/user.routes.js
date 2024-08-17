import express from "express";

import {
  getAllUsers,
  getUserProfile,
  selectUser,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/profile/:name", protectRoute, getUserProfile);
router.get("/getallusers", getAllUsers);
router.get("/search", protectRoute, selectUser);

export default router;
