import express from "express"
import { checkAuth, login, signup, updateProfile, getUser} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import dotenv from "dotenv";

const userRouter = express.Router();
userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.get("/get-user", getUser);
userRouter.put("/update-profile",protectRoute,updateProfile)
userRouter.get("/check",protectRoute,checkAuth)



export default userRouter;
