import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PickupService } from "./pickup.service";
import httpstatus from "http-status";

const getPickupRequests = catchAsync(async (req, res) => {
  const result = await PickupService.getPickupRequests(req.user!.userId);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Pickup requests retrieved successfully",
    data: result,
  });
});

const getAvailablePickupRiders = catchAsync(async (req, res) => {
  const result = await PickupService.getAvailablePickupRiders(req.user!.userId);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Available riders retrieved successfully",
    data: result,
  });
});

const assignRider = catchAsync(async (req, res) => {
  const result = await PickupService.assignRider(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Rider assigned successfully",
    data: result,
  });
});

const getMyAssignedPickups = catchAsync(async (req, res) => {
  const result = await PickupService.getMyAssignedPickups(req.user!.userId);

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Assigned pickups retrieved successfully",
    data: result,
  });
});

const acceptPickup = catchAsync(async (req, res) => {
  const result = await PickupService.acceptPickup(
    req.user!.userId,
    req.params.parcelId as string,
  );

  sendResponse(res, {
    statusCode: httpstatus.OK,
    success: true,
    message: "Pickup accepted successfully",
    data: result,
  });
});

export const PickupController = {
  getPickupRequests,
  getAvailablePickupRiders,
  assignRider,
  getMyAssignedPickups,
  acceptPickup,
};