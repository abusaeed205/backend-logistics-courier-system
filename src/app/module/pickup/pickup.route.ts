import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { PickupController } from "./pickup.controller";

const router = Router();

// Branch Agent
router.get(
  "/requests",
  auth(UserRole.BRANCH_AGENT),
  PickupController.getPickupRequests,
);

router.get(
  "/available-riders",
  auth(UserRole.BRANCH_AGENT),
  PickupController.getAvailablePickupRiders,
);

router.post(
  "/assign-rider",
  auth(UserRole.BRANCH_AGENT),
  PickupController.assignRider,
);

// Pickup Rider
router.get(
  "/my-assigned",
  auth(UserRole.PICKUP_RIDER),
  PickupController.getMyAssignedPickups,
);

router.patch(
  "/:parcelId/accept",
  auth(UserRole.PICKUP_RIDER),
  PickupController.acceptPickup,
);

export const PickupRouters = router;