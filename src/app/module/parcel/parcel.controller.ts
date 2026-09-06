import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ParcelService } from "./parcel.service";
import httpstatus from "http-status";

const createParcel = catchAsync(async (req:Request, res:Response) => {
  // Auth middleware থেকে logged-in user-এর তথ্য এবং ঐ user এর ID নিতেছি,তার পর req.body মাধ্যমে 
  // সেই ‍user এর আন্ডারে parcel তৈরী করতেছি 
  const result = await ParcelService.createParcel(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpstatus.CREATED,
    success: true,
    message: "Parcel created successfully",
    data: result,
  });
});

const getMyParcels = catchAsync(async (req:Request, res:Response) => {
  // Auth middleware থেকে logged-in user-এর ID নিচ্ছি
  // এবং query দিয়ে ঐ user-এর parcels খুঁজছি
  const result= await ParcelService.getMyParcels(req.user!.userId, req.query);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Parcels retrieved successfully",
    data:result
  });
});

// const getSingleParcel = catchAsync(async (req:Request, res:Response) => {
//    const userId = req.user?.userId;
//   const { parcelId } = req.params;

//   if (!userId) {
//     throw new Error("User information is missing");
//   }

//   if (!parcelId) {
//     throw new Error("Parcel ID is required");
//   }

//   const result = await ParcelService.getSingleParcel(
//     userId,
//     parcelId
//   );


//   sendResponse(res, {
//     statusCode: httpstatus.OK,
//     success: true,
//     message: "Parcel retrieved successfully",
//     data: result,
//   });
// });

const getSingleParcel = catchAsync(
  async (req: Request, res: Response) => {

    // বর্তমানে login করা user-এর ID
     // URL থেকে parcelId নেওয়া হচ্ছে
    // যেমন: /parcel/abc123
    const userId = req.user?.userId;
    const { parcelId } = req.params;

    if (!userId) {
      throw new Error("User information is missing");
    }

    // parcelId অবশ্যই string হতে হবে
    if (typeof parcelId !== "string") {
      throw new Error("Invalid Parcel ID");
    }

    const result = await ParcelService.getSingleParcel(
      userId,
      parcelId
    );

    sendResponse(res, {
      statusCode: httpstatus.OK,
      success: true,
      message: "Parcel retrieved successfully",
      data: result,
    });
  }
);


const updateParcel = catchAsync(async (req, res) => {
  const result = await ParcelService.updateParcel(
    req.user!.userId,
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Parcel updated successfully",
    data: result,
  });
});

const cancelParcel = catchAsync(async (req, res) => {
  const result = await ParcelService.cancelParcel(req.user!.userId, req.params.id as string);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Parcel cancelled successfully",
    data: result,
  });
});


export const ParcelController = {
  createParcel,
  getMyParcels,
  getSingleParcel,
  updateParcel ,
  cancelParcel 
};