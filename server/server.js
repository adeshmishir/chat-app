import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// ✅ Configure allowed frontend origin
const CLIENT_URL = "https://chat-app-sigma-bay.vercel.app";

// 📦 Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Setup CORS for both REST API and Socket.IO
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// 🔗 Routes
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// 🧠 Start DB + Server
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("🚀 Server running on PORT:", PORT));

// ⚡️Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

export const userSocketMap = {}; // { userId: socketId }

// ❌ Block all custom namespaces except "/"
io.of(/^\/(?!$).+/).on("connection", (socket) => {
  console.log("❌ Blocked namespace:", socket.nsp.name);
  socket.disconnect(true);
});

// ✅ Handle default namespace "/"
io.of("/").on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  console.log("✅ Connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
