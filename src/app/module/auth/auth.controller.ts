import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpstatus from "http-status";


const registerUser=catchAsync(async(req:Request,res:Response)=>{
    const payload=req.body
    await AuthService.registeruser(payload)
    sendResponse(res,{
        statusCode:httpstatus.CREATED,
        success:true,
        message:"Please check your email for OTP verification.",
        data:null
    })

})

const verifyUserEmail=catchAsync(async(req:Request,res:Response)=>{
    const payload=req.body
    const result= await AuthService.verifyUserEmail(payload)

    const { accessToken, refreshToken,user,merchant} = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

    sendResponse(res,{
        statusCode:httpstatus.OK,
        success:true,
        message:"Email verified successfully.",
        data:{
            accessToken,
            refreshToken,
            user,
            merchant
        }
    })

})

const loginUser=catchAsync(async(req:Request,res:Response)=>{
    const payload=req.body
    const result=await AuthService.loginuser(payload)

    const{accessToken,refreshToken}=result

    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:false,
        sameSite:"none",
        // তাই এখানে Cookie-এর lifetime = 24 ঘণ্টা।
		maxAge: 1000 * 60 * 60 * 24,
    })

    // Refresh Token Cookie হিসেবে Browser-এ পাঠানো হচ্ছে
	res.cookie("refreshToken", refreshToken, {
		// JavaScript থেকে cookie access করা যাবে না।
		httpOnly: true,
		// Production-এ HTTPS থাকলে true হওয়া উচিত।
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

    sendResponse(res,{
        statusCode:httpstatus.CREATED,
        success:true,
        message:"Login Successfully",
        data:result
    })
})

const getMe=catchAsync(async(req:Request,res:Response)=>{
    //user auther middleware থেকে আসতেছে 
    const user=req.user 

    if (!user) {
		throw new Error("User information is missing in the request");
	}

    const result=await AuthService.getMe(user)

    sendResponse(res,{
        statusCode:httpstatus.CREATED,
        success:true,
        message:"Login Successfully",
        data:result
    })
})

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new Error("Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});


const forgetpassword = catchAsync(async (req: Request, res: Response) => {
	
    await AuthService.forgetpassword(req.body)
    
	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data:null
	});
});

const resetpassword = catchAsync(async (req: Request, res: Response) => {
	
    await AuthService.resetpassword(req.body)

	sendResponse(res, {
		statusCode: httpstatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data:null
	});
});



export const AuthController={
    registerUser,
    verifyUserEmail,
    loginUser,
    getMe,
    refreshToken,
    forgetpassword,
    resetpassword
}
