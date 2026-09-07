import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TrackingService } from "./tracking.service";
import httpstatus from "http-status";

const getTrackingHistory = catchAsync(async (req, res) => {
  const result = await TrackingService.getTrackingHistory(
    req.params.trackingCode as string,
  );

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Tracking history retrieved successfully",
    data: result,
  });
});

const getCurrentStatus = catchAsync(async (req, res) => {
  const result = await TrackingService.getCurrentStatus(
    req.params.trackingCode as string,
  );

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Current status retrieved successfully",
    data: result,
  });
});

const getTrackingHistoryByMerchant = catchAsync(async (req, res) => {
  const result = await TrackingService.getTrackingHistoryByMerchant(
    req.user!.userId,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Tracking history retrieved successfully",
    data: result,
  });
});

export const TrackingController = {
  getTrackingHistory,
  getCurrentStatus,
  getTrackingHistoryByMerchant,
};