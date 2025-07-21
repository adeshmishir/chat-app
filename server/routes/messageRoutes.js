import express from "express"
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUserForSidebar, markMessageSeen, sendMessage ,editMessage,deleteMessage, permanentlyDeleteMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();
messageRouter.get("/users",protectRoute,getUserForSidebar)
messageRouter.get("/:id",protectRoute,getMessages)
messageRouter.get("/mark/:id",protectRoute,markMessageSeen)
messageRouter.post("/send/:id",protectRoute,sendMessage)
messageRouter.put("/edit/:messageId", protectRoute, editMessage);
messageRouter.delete("/delete/:messageId", protectRoute, deleteMessage);
messageRouter.delete("/permanent/:messageId", protectRoute, permanentlyDeleteMessage);

export default messageRouter;
