import { NextFunction, Request, Response } from "express";
import z from "zod";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import httpstatus from "http-status"


// zodSchema props এর মতো করে ডাটা রিছিব করতেছি
// এটা route এ ব্যবহার করছি
export const validateRequest = (zodSchema: z.ZodObject) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const payload = req.body ?? {};
		const result = zodSchema.safeParse(payload);

		// যদি validation সফল না হয়
		// if (!result.success) {

		//   // Zod validation errors console
		//   console.log(result.error.issues);

		//   throw new Error(result.error.issues[0].message);
		// }

		// if (!result.success) {
		// 	console.log(result.error.issues);

		// 	const firstError = result.error.issues[0];

		// 	throw new Error(`${firstError.path.join(".")}: ${firstError.message}`);
		// }

		if (!result.success) {
    console.log(result.error.issues);

    const firstError = result.error.issues[0];

    if (!firstError) {
        throw new AppError(
            httpstatus.BAD_REQUEST,
            "Validation failed"
        );
    }

    throw new AppError(
        httpstatus.BAD_REQUEST,
        `${firstError.path.join(".")}: ${firstError.message}`
    );
}


		//সফল validated data আবার req.body-এর মধ্যেই রেখে দিচ্ছি
		req.body = result.data;

		next();
	});
};
