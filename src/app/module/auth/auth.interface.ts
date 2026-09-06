import { UserRole } from "../../../../prisma/generated/prisma/enums"

export interface IRegisterUser {
    name:string
    email:string
    phone?:string
    password:string
    businessName:string
    pickupAddress:string
}

export interface IVerifyEmail {
    email:string
    otp:string
}

export interface IRequestUserProfile {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
}

export interface Iforgetpassword {
	email: string;
}

// Service এ এগুলো ব্যবহার করা হয়েছে
export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}

