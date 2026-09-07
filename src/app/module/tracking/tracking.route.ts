import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { TrackingController } from "./tracking.controller";

const router = Router();

// Public — কারো auth লাগবে না, শুধু trackingCode দিয়ে চেক করবে
router.get("/track/:trackingCode", TrackingController.getTrackingHistory);
router.get("/track/:trackingCode/status", TrackingController.getCurrentStatus);

// Merchant নিজের parcel-এর history দেখবে (parcel `id` দিয়ে)
router.get(
  "/my-parcel/:id/history",
  auth(UserRole.MERCHANT),
  TrackingController.getTrackingHistoryByMerchant,
);

export const TrackingRouters = router;