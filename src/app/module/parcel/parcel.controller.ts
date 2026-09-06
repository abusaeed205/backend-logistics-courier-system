import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ParcelService } from "./parcel.service";
import httpstatus from "http-status";

const createParcel = catchAsync(async (req:Request, res:Response) => {
  const result = await ParcelService.createParcel(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpstatus.CREATED,
    success: true,
    message: "Parcel created successfully",
    data: result,
  });
});

const getMyParcels = catchAsync(async (req:Request, res:Response) => {
  const result = await ParcelService.createParcel(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpstatus.CREATED,
    success: true,
    message: "Parcel created successfully",
    data: result,
  });
});

export const ParcelController = {
  createParcel,
  getMyParcels
};