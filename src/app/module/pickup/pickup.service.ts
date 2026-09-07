import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/appError";
import httpstatus from "http-status";
import { IAssignRider } from "./pickup.interface";

// ------------------- Get Pickup Requests (Branch Agent) -------------------
// Branch Agent তার নিজের branch-এর district-এ যত parcel এখনো rider assign
// হয়নি (status = PICKUP_REQUESTED, pickupRiderId = null) সেগুলো দেখবে
const getPickupRequests = async (branchAgentUserId: string) => {
  const branchStaff = await prisma.branchStaff.findUnique({
    where: { userId: branchAgentUserId },
    include: { branch: { include: { district: true } } },,
  });

  if (!branchStaff) {
    throw new AppError(httpstatus.NOT_FOUND, "Branch staff profile not found");
  }

  const result = await prisma.parcel.findMany({
    where: {
      currentStatus: "PICKUP_REQUESTED",
      pickupRiderId: null,
      merchant: {
        districtId: branchStaff.branch.district.name,
      },
    },
    orderBy: { createdAt: "asc" }, // পুরোনো request আগে দেখাবে (FIFO)
    include: {
      merchant: {
        select: {
          businessName: true,
          pickupAddress: true,
          district: true,
          thana: true,
          user: { select: { name: true, phone: true } },
        },
      },
    },
  });ূূ

  return result;
};

// ------------------- Get Available Riders (Assign করার সময় dropdown-এর জন্য) -------------------
const getAvailablePickupRiders = async (branchAgentUserId: string) => {
  const branchStaff = await prisma.branchStaff.findUnique({
    where: { userId: branchAgentUserId },
  });

  if (!branchStaff) {
    throw new AppError(httpstatus.NOT_FOUND, "Branch staff profile not found");
  }

  const riders = await prisma.rider.findMany({
    where: {
      branchId: branchStaff.branchId,
      type: { in: ["PICKUP", "BOTH"] },
      availability: "AVAILABLE",
    },
    select: {
      id: true,
      vehicleType: true,
      user: { select: { name: true, phone: true } },
    },
  });

  return riders;
};

// ------------------- Assign Rider (Branch Agent) -------------------
const assignRider = async (branchAgentUserId: string, payload: IAssignRider) => {
  const branchStaff = await prisma.branchStaff.findUnique({
    where: { userId: branchAgentUserId },
    include: { branch: true },
  });

  if (!branchStaff) {
    throw new AppError(httpstatus.NOT_FOUND, "Branch staff profile not found");
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id: payload.parcelId },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.currentStatus !== "PICKUP_REQUESTED") {
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "This parcel is not in a pickup-requestable state",
    );
  }

  if (parcel.pickupRiderId) {
    throw new AppError(httpstatus.BAD_REQUEST, "A rider is already assigned to this parcel");
  }

  const rider = await prisma.rider.findUnique({
    where: { id: payload.riderId },
  });

  if (!rider) {
    throw new AppError(httpstatus.NOT_FOUND, "Rider not found");
  }

  if (rider.branchId !== branchStaff.branchId) {
    throw new AppError(
      httpstatus.FORBIDDEN,
      "You can only assign riders from your own branch",
    );
  }

  if (rider.type !== "PICKUP" && rider.type !== "BOTH") {
    throw new AppError(httpstatus.BAD_REQUEST, "This rider does not handle pickups");
  }

  if (rider.availability !== "AVAILABLE") {
    throw new AppError(httpstatus.BAD_REQUEST, "This rider is not currently available");
  }

  // ট্রানজেকশন — parcel update, rider availability update, tracking event — সবকিছু একসাথে
  // কোনো একটা fail করলে সবকিছু rollback হয়ে যাবে
  const result = await prisma.$transaction(async (tx) => {
    const updatedParcel = await tx.parcel.update({
      where: { id: payload.parcelId },
      data: {
        pickupRiderId: payload.riderId,
        originBranchId: branchStaff.branchId,
        currentStatus: "RIDER_ASSIGNED",
      },
    });

    await tx.rider.update({
      where: { id: payload.riderId },
      data: { availability: "ON_DUTY" },
    });

    await tx.trackingEvent.create({
      data: {
        parcelId: payload.parcelId,
        status: "RIDER_ASSIGNED",
        note: `Pickup rider assigned by branch agent`,
        branchId: branchStaff.branchId,
        actorType: "BRANCH_AGENT",
        scannedById: branchAgentUserId,
      },
    });

    return updatedParcel;
  });

  return result;
};

// ------------------- Get My Assigned Pickups (Rider) -------------------
const getMyAssignedPickups = async (riderUserId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { userId: riderUserId },
  });

  if (!rider) {
    throw new AppError(httpstatus.NOT_FOUND, "Rider profile not found");
  }

  const result = await prisma.parcel.findMany({
    where: {
      pickupRiderId: rider.id,
      currentStatus: "RIDER_ASSIGNED",
    },
    orderBy: { updatedAt: "asc" },
    include: {
      merchant: {
        select: {
          businessName: true,
          pickupAddress: true,
          district: true,
          thana: true,
          user: { select: { name: true, phone: true } },
        },
      },
    },
  });

  return result;
};

// ------------------- Accept Pickup (Rider) -------------------
// Rider physically গিয়ে parcel সংগ্রহ করার পর এটা কল হবে —
// status RIDER_ASSIGNED থেকে PICKED_UP-এ যাবে
const acceptPickup = async (riderUserId: string, parcelId: string) => {
  const rider = await prisma.rider.findUnique({
    where: { userId: riderUserId },
  });

  if (!rider) {
    throw new AppError(httpstatus.NOT_FOUND, "Rider profile not found");
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id: parcelId },
  });

  if (!parcel) {
    throw new AppError(httpstatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.pickupRiderId !== rider.id) {
    throw new AppError(
      httpstatus.FORBIDDEN,
      "This parcel is not assigned to you",
    );
  }

  if (parcel.currentStatus !== "RIDER_ASSIGNED") {
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "This parcel is not awaiting pickup",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedParcel = await tx.parcel.update({
      where: { id: parcelId },
      data: { currentStatus: "PICKED_UP" },
    });

    await tx.trackingEvent.create({
      data: {
        parcelId,
        status: "PICKED_UP",
        note: "Parcel picked up by rider",
        actorType: "RIDER",
        scannedById: riderUserId,
      },
    });

    return updatedParcel;
  });

  return result;
};

export const PickupService = {
  getPickupRequests,
  getAvailablePickupRiders,
  assignRider,
  getMyAssignedPickups,
  acceptPickup,
};