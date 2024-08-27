import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173/"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`New User connected: ${socket.id}`);

  socket.on("registerUser", (userId) => {
    socket.userId = userId;
    console.log(`User registered: ${userId}`);
  });

  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User joined room: ${chatId}`);
  });

  socket.on("sendMessage", (message) => {
    try {
      console.log("Message received on server:", message);
      const chatId = message.chatId;
      io.to(chatId).emit("messageReceived", {
        ...message,
        senderId: socket.userId,
        chatId: chatId,
      });
    } catch (error) {
      console.error("Error broadcasting message:", error.message);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`A user disconnected: ${socket.userId} due to ${reason}`);
  });
});

export { app, io, httpServer };
