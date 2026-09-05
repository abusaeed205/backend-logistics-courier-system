import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { AppError } from "../../utils/appError"
import httpstatus from "http-status"
import crypto from "crypto";
import { redisclient } from "../../lib/redis"
import { transporter } from "../../lib/nodemailler"
import config from "../../config"
import path from "path"
import ejs from 'ejs';
import { UserStatus } from "../../../../prisma/generated/prisma/enums";
import { IRegisterUser, IRequestUserProfile, IVerifyEmail } from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";
import { JwtPayload, SignOptions } from "jsonwebtoken";


const registeruser=async(payload:IRegisterUser)=>{

    const {password,name}=payload
    const email = payload.email.trim().toLowerCase();

    const isUserExists=await prisma.user.findUnique({
        where:{email}
    })

    if(isUserExists){
        throw new AppError(httpstatus.CONFLICT,"User already exists")
    }

    const hashedPassword=await bcrypt.hash(password,12)

    
	// ----------OTP Redise এ সেট------------

	const expirationMinutes = 5 * 60; // টাইমটা বলেদিতেছে কতো মিনিট থাকবে OTP
	const otpkey = `user-registration-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString(); // crypto দিয়ে Random OTP বানাচ্ছি

   // redisclient lib foulder থেকে আসতেছে এবং clien email and OTP  Set করছি
	await redisclient.set(otpkey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationMinutes,
			//   উপরের variable থেকে আসতেছে
		},
	});

    // register Unique key for user registration data in Redis 
    const userRegistrationKey = `user-registration-data:${email}`;

    
	const redisUserDataPayload = {
		name:payload.name,
		email:payload.email,
		password: hashedPassword,
        businessName:payload.businessName,
        pickupAddress:payload.pickupAddress,
        phone:payload.phone
	};

    // client DATA রেডিসে Set করছি /redisclient lib থেকে আসতেছে
	await redisclient.set(
		userRegistrationKey,
		JSON.stringify(redisUserDataPayload),
		{
			// redis এর ডাটা stringify অবস্থায় থাকে ,তাই Object কে stringify করছি
			expiration: {
				type: "EX",
				value: expirationMinutes,
			},
		},
	);

    // ------------------------------  Email Send -----------------------------------------

	// যে ফাইলটাতে ejs কোড রাখা আছে সেটা এটার সাথে Join দিলাম
	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/registation-user-otp.ejs",
	);

	// email massage temp formet
	const templateData = {
		name,
		email,
		otpValue, // OTP এখানে যেভাবে লিখবো templates/forgot-password.ejs এ সেইম থাকবে
		expirationMinutes: expirationMinutes / 60,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	// এখানে Email Verification-এর জন্য email এ OTP পাঠানো হচ্ছে।
	await transporter.sendMail({
		// env config file থেকে আসতেছে
		from: config.email_sender,
		to: email,
		subject: "Email Verification",
		html,
	});

}

const verifyUserEmail=async(payload:IVerifyEmail)=>{
    const otp = payload.otp;
	const email = payload.email.trim().toLocaleLowerCase();


    const isUserExists=await prisma.user.findUnique({
        where:{email}
    })
    
    if(isUserExists?.status==="SUSPENDED"){
        throw new AppError(httpstatus.FORBIDDEN,"Your account is suspended. Please contact support for assistance.")
    }

    if (isUserExists?.emailVerified) {
		throw new AppError(httpstatus.CONFLICT,"Email ALready Verified");
	}

    if (isUserExists?.isDeleted || isUserExists?.status === "DELETED") {
		throw new AppError(httpstatus.NOT_FOUND,"User not found");
	}

    const otpkey = `user-registration-otp:${email}`;
	// redisclient lib foulder থেকে আসতেছে এবং redios থেকে otp get করা হচ্ছে
	const redisOtp = await redisclient.get(otpkey);

    if(!redisOtp || redisOtp !== otp){
        throw new AppError(httpstatus.BAD_REQUEST,"Invalid or expired OTP");
    }

    await redisclient.del(otpkey);

    // Redis থেকে user registration data get করা হচ্ছে
    const userRegistrationKey = `user-registration-data:${email}`;
    const redisUserData = await redisclient.get(userRegistrationKey);

    if(!redisUserData){
        throw new AppError(httpstatus.BAD_REQUEST,"User Does not exist ");
    }

    const userPayload:IRegisterUser=JSON.parse(redisUserData)

    // এখান থেকে Data ডাটাবেইজে পাঠাচ্ছি
    const CreatedUser=await prisma.user.create({
        data:{
           name: userPayload.name,
           email: userPayload.email,
           phone: userPayload.phone,
           password:userPayload.password,
           status:UserStatus.ACTIVE, //from prisma
           emailVerified:true,
           merchant:{
            create:{
                businessName: userPayload.businessName,
                pickupAddress: userPayload.pickupAddress,
            }
           }
        },
        omit:{password:true},
        include:{merchant:true}
    })

    // auto delete হবে email
	await redisclient.del(userRegistrationKey);

    // যে ফাইলটাতে ejs কোড রাখা আছে সেটা এটার সাথে Join দিলাম
	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/patient-welcome-email.ejs",
	);

    // email massage temp formet
	const templateData = {
		name: CreatedUser.name,
	};

    const html = await ejs.renderFile(tempatePath, templateData);

    await transporter.sendMail({
		// env config file থেকে আসতেছে
		from: config.email_sender,
		to: email,
		subject: "Wellcome To PH Healthcare System",
		html,
	});

    // createdUser object থেকে merchant আলাদা করে নেওয়া, আর বাকি সব property user object-এর মধ্যে রাখা।
    const { merchant, ...user } = CreatedUser;
	// এই ফাইলটা accessToken এবং refreshToken এ যাচ্ছে
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

    // jwtUtils Utils ফাইল থেকে আসতেছে
	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

    // jwtUtils Utils ফাইল থেকে আসতেছে
	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

    return {
		user,
		merchant,
		accessToken,
		refreshToken,
	};



}

const loginuser=async(payload:IRegisterUser)=>{
    const {password}=payload
    const email = payload.email.trim().toLowerCase();

    const user=await prisma.user.findUnique({
        where:{email}
    })

    if(!user){
        throw new AppError(httpstatus.NOT_FOUND,"User Not Fount")
    }

    if (user.status === UserStatus.SUSPENDED) {
		throw new AppError(httpstatus.NOT_FOUND,"User is suspended");
	}

	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(httpstatus.NOT_FOUND,"User is Deleted");
	}

    const isPasswordMatched=await bcrypt.compare(
        password,
        user.password as string
    )

    if(!isPasswordMatched){
        throw new AppError(httpstatus.NOT_FOUND,"Invalid Credentials")
    }

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
}

// Frontend-এ Login করা User তার নিজের Profile Data দেখার জন্য এটা বানানো

const getMe=async(user: IRequestUserProfile)=>{

    const isUserExists=await prisma.user.findUnique({
        where:{
            id:user.userId
        },
        include:{
            merchant:true
        },
        omit:{
            password:true
        }
    })

    if(!isUserExists){
        throw new AppError(httpstatus.NOT_FOUND,"user Not found")
    }
    
    return isUserExists
}

const refreshToken=async(token:string)=>{
    const verifiedRefreshToken=jwtUtils.verifyToken(
        token,// from payload
        config.jwt_refresh_secret,
    )

     if(!verifiedRefreshToken.success || !verifiedRefreshToken.data){
        throw new AppError(httpstatus.NOT_FOUND,config.node_env === "development"?
            verifiedRefreshToken.error:"Invalid refresh token"
        )
    }

    const data=verifiedRefreshToken.data as JwtPayload

    const user=await prisma.user.findUnique({
        where:{id:data.userId},
    })

     if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpstatus.FORBIDDEN, "User is inactive or not found");
	}

    const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};

}



export const AuthService={
    registeruser,
    verifyUserEmail,
    loginuser,
    getMe,
    refreshToken
}