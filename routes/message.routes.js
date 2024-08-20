import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { allMessages, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Todo : sending the message
// Todo : fetch all of the messages in a perticular chat

router.post("/", protectRoute, sendMessage);
router.get("/:chatId", protectRoute, allMessages);

export default router;
