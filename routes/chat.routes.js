import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  accessChat,
  addToGroup,
  createGroupChat,
  fetchChats,
  removeFromGroup,
  renameGroup,
} from "../controllers/chat.controllers.js";

const router = express.Router();

router.post("/", protectRoute, accessChat);
router.get("/fetchchats", protectRoute, fetchChats);
router.post("/creategroup", protectRoute, createGroupChat);
router.put("/renamegroup", protectRoute, renameGroup);
router.put("/addtogroup", protectRoute, addToGroup);
router.put("/removefromgroup", protectRoute, removeFromGroup);

export default router;
