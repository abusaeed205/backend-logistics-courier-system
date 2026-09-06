import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import httpstatus from "http-status";
import { ICreateParcel } from "./parcel.interface";

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

  const result = await prisma.parcel.create({
    data: {
      trackingCode: generateTrackingCode(),
      merchantId: merchant.id,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      recipientAddress: payload.recipientAddress,
      recipientDistrict: payload.recipientDistrict,
      recipientThana: payload.recipientThana,
      parcelType: payload.parcelType,
      weightKg: payload.weightKg,
      description: payload.description,
      paymentType: payload.paymentType,
      codAmount: payload.codAmount ?? 0,
      // যদি merchant-এর defaultDeliveryCharge সেট থাকে এবং payload-এ না দেওয়া হয়, সেটা ব্যবহার করা যায়
      deliveryCharge: payload.deliveryCharge ?? merchant.defaultDeliveryCharge ?? 0,
    },
  });

  return result;
};

export const ParcelService = {
  createParcel,
};