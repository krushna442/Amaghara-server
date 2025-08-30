import express from "express";
import { createMessage, getMessages, getMessageById, deleteMessage } from "../controllers/messageController.js";

const router = express.Router();

// Create new message
router.post("/messages", createMessage);

// Get all messages
router.get("/messages", getMessages);
// Delete message by ID
router.delete("/messages:id", deleteMessage);

export default router;
