import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/zodValidateRequest";
import { ZodUserValidation } from "./auth.validation";
import { auth } from "../../middleware/checkAuth";


const routers=Router()

routers.post("/register",validateRequest(ZodUserValidation.userZodSchema),AuthController.registerUser)
routers.post("/verify-email",validateRequest(ZodUserValidation.userEmailVerifyZodSchema),AuthController.verifyUserEmail)
routers.post("/login",AuthController.loginUser)

// auth middleware শুধু মাত্র login করা user এর প্রফাইল দেখাবে
routers.get("/me",auth(),AuthController.getMe)

routers.post("/refresh-token", AuthController.refreshToken);
routers.post("/forgetpassword",validateRequest(ZodUserValidation.forgetPasswordZodSchema),AuthController.forgetpassword)
routers.post("/reset-password",validateRequest(ZodUserValidation.resetPasswordZodSchema),AuthController.resetpassword)


export const AuthRouters=routers