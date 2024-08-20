import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create an HTTP server
const httpServer = createServer(app);

// Create a new instance of Socket.IO, attached to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Adjust this based on your frontend's origin
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Set up Socket.IO connection
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  let inactivityTimer;

  // Store user ID in the socket object
  socket.on("registerUser", (userId) => {
    socket.userId = userId; // Store the user ID in the socket
    console.log(`User registered: ${userId}`);
  });

  const startInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      socket.disconnect(true);
      console.log(`User disconnected due to inactivity: ${socket.userId}`);
    }, 60000); // 60 seconds
  };

  // Start the inactivity timer when the user connects
  startInactivityTimer();

  // Join a chat room
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User joined room: ${chatId}`);
  });

  // Listen for new messages
  socket.on("sendMessage", (message) => {
    console.log("Message received on server:", message);
    const chatId = message.chatId; // Assuming message contains a chat ID
    io.to(chatId).emit("messageReceived", {
      ...message,
      senderId: socket.userId, // Attach the sender's user ID to the message
    });

    // Reset the inactivity timer whenever a message is sent
    startInactivityTimer();
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.userId}`);
    clearTimeout(inactivityTimer); // Clear the timer if the user manually disconnects
  });
});

// Start the server and connect to MongoDB
httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  connectMongoDB();
});
