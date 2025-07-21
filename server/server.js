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

export const io = new Server(server, {
  cors: { origin: "*" },
});

// 🛑 Block and log custom/invalid namespaces (e.g., /chat-app.users)
io.of(/^\/(?!$).+/).on("connection", (socket) => {
  console.log("❌ Blocked namespace:", socket.nsp.name);
  console.log("   ➤ From IP:", socket.handshake.address);
  console.log("   ➤ Headers:", socket.handshake.headers);
  socket.disconnect(true);
});

// ✅ Allow only default namespace "/"
export const userSocketMap = {}; // { userId: socketId }

io.of("/").on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  
  console.log("✅ Connected to namespace:", socket.nsp.name);
  console.log("User connected:", userId);

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


// 📦 Middleware
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded())
app.use(cors());

// 🔗 Routes
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// 🧠 Start DB + Server
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("🚀 Server running on PORT:", PORT));
