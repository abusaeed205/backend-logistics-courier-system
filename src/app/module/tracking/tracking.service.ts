import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import httpstatus from "http-status";

// ------------------- Tracking History (public, trackingCode দিয়ে) -------------------
const getTrackingHistory = async (trackingCode: string) => {
  const parcel = await prisma.parcel.findUnique({
    where: { trackingCode },
    select: {
      id: true,
      trackingCode: true,
      currentStatus: true,
      recipientName: true,
      recipientDistrict: true,
      createdAt: true,
      trackingEvents: { //percel এর সাথে সংযুক্ত ডাটাবেইজ
        orderBy: { createdAt: "asc" }, 
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
          actorType: true,
          branch: { select: { name: true, code: true } },
        },
      },
    },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Invalid tracking code");
  }

  return parcel;
};

// ------------------- Current Status (public, trackingCode দিয়ে) -------------------
const getCurrentStatus = async (trackingCode: string) => {
  const parcel = await prisma.parcel.findUnique({
    where: { trackingCode },
    select: {
      trackingCode: true,
      currentStatus: true,
      deliveryAttempts: true,
      lastFailureReason: true,
      deliveredAt: true,
      currentBranch: { select: { name: true, code: true, district: true } },
    },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Invalid tracking code");
  }

  return parcel;
};

// ------------------- Merchant-এর নিজের parcel এর history (auth লাগবে) -------------------
const getTrackingHistoryByMerchant = async (
  merchantUserId: string,
  parcelId: string,
) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId: merchantUserId },
  });

  if (!merchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, merchantId: merchant.id },
    select: {
      id: true,
      trackingCode: true,
      currentStatus: true,
      trackingEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
          actorType: true,
          branch: { select: { name: true, code: true } },
        },
      },
    },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  return parcel;
};

export const TrackingService = {
  getTrackingHistory,
  getCurrentStatus,
  getTrackingHistoryByMerchant,
};