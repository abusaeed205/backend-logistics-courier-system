import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import httpstatus from "http-status";
import { ICreateParcel, IGetMyParcel, IUpdateParcel } from "./parcel.interface";
import { Prisma } from "../../../../prisma/generated/prisma/client";

// Tracking code জেনারেট করা — customer facing unique code
const generateTrackingCode = () => {
  return `PCL-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
};

const createParcel = async (merchantUserId: string, payload: ICreateParcel) => {
  // লগইন করা user থেকে merchant profile বের করা
  const merchant = await prisma.merchant.findUnique({
    where: { userId: merchantUserId },
  });

  if (!merchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

 if (!payload.recipientUnionId) {
    throw new AppError(httpstatus.BAD_REQUEST, "Recipient union is required");
  }


   const result = await prisma.parcel.create({
    data: {
      trackingCode: generateTrackingCode(),
      merchantId: merchant.id,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      recipientAddress: payload.recipientAddress,
      recipientUnionId: payload.recipientUnionId, // <-- district/thana এর বদলে এটা
      parcelType: payload.parcelType,
      weightKg: payload.weightKg,
      description: payload.description,
      paymentType: payload.paymentType,
      codAmount: payload.codAmount ?? 0,
      deliveryCharge: payload.deliveryCharge ?? merchant.defaultDeliveryCharge ?? 0,
    },
  });

  return result;
};

const getMyParcels = async(marchantUserId: string,query: IGetMyParcel) => {
   // পেজিনেশন
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  // মারসেন্ট খোজা হচ্ছে 
  const marchant = await prisma.merchant.findUnique({
    where: { userId: marchantUserId },
  });

  if (!marchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

  const andConditions: Prisma.ParcelWhereInput[] = [
    { merchantId: marchant.id },
  ];

  // যদি status দেওয়া থাকে, তাহলে সেই status অনুযায়ী Parcel filter করো
  if (query.status) {
    andConditions.push({ currentStatus: query.status as any });
  }

  const whereConditions: Prisma.ParcelWhereInput = { AND: andConditions };

  const result = await prisma.parcel.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      // প্রতিটা parcel এর সর্বশেষ status/scan event
      trackingEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const total = await prisma.parcel.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};


const getSingleParcel= async(marchantUserId: string,parcelId: string) => {
   const merchant=await prisma.merchant.findUnique({
    where:{userId:marchantUserId}
   })

  if (!merchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

   const parcel = await prisma.parcel.findFirst({
    where: {
      id: parcelId,
      merchantId: merchant.id, // অন্য merchant-এর parcel যাতে দেখতে না পারে
    },
    include: {
      trackingEvents: {
        orderBy: { createdAt: "asc" }, // পুরো টাইমলাইন, পুরোনো থেকে নতুন
      },
      pickupRider: {
        include: { user: { select: { name: true, phone: true } } },
      },
      deliveryRider: {
        include: { user: { select: { name: true, phone: true } } },
      },
      originBranch: { select: { name: true, code: true } },
      destinationBranch: { select: { name: true, code: true } },
      currentBranch: { select: { name: true, code: true } },
    },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  return parcel;

};


// ------------------- Update Parcel -------------------
const updateParcel = async (
  merchantUserId: string,
  parcelId: string,
  payload: IUpdateParcel,
) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId: merchantUserId },
  });

  if (!merchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, merchantId: merchant.id },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  // pickup হয়ে যাওয়ার পর recipient/parcel details বদলানো যাবে না
  if (parcel.currentStatus !== "PICKUP_REQUESTED") {
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "Parcel can only be updated before pickup",
    );
  }

  const result = await prisma.parcel.update({
    where: { id: parcelId },
    data: payload,
  });

  return result;
};

// ------------------- Cancel Parcel -------------------
const cancelParcel = async (merchantUserId: string, parcelId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId: merchantUserId },
  });

  if (!merchant) {
    throw new AppError(httpstatus.NOT_FOUND, "Merchant profile not found");
  }

  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, merchantId: merchant.id },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.currentStatus === "CANCELLED") {
    throw new AppError(httpstatus.BAD_REQUEST, "Parcel is already cancelled");
  }

  // pickup হয়ে যাওয়ার পর merchant নিজে cancel করতে পারবে না
  if (parcel.currentStatus !== "PICKUP_REQUESTED") {
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "Parcel can only be cancelled before pickup",
    );
  }

  const result = await prisma.parcel.update({
    where: { id: parcelId },
    data: { currentStatus: "CANCELLED" },
  });

  return result;
};

export const ParcelService = {
  createParcel,
  getMyParcels,
  getSingleParcel,
  updateParcel,
  cancelParcel,
};