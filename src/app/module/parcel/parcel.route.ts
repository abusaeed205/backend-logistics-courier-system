import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/zodValidateRequest";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { ParcelController } from "./parcel.controller";
import { ParcelValidation } from "./parcel.validation";

const router = Router();

router.post(
  "/create-parcel",
  auth(UserRole.MERCHANT),
  validateRequest(ParcelValidation.createParcelZodSchema),
  ParcelController.createParcel,
);

router.get(
  "/my-parcels",
  auth(UserRole.MERCHANT),
  ParcelController.getMyParcels,
);

router.get(
  "/:id",
  auth(UserRole.MERCHANT),
  ParcelController.getSingleParcel,
);

router.patch(
  "/:id",
  auth(UserRole.MERCHANT),
  validateRequest(ParcelValidation.updateParcelZodSchema),
  ParcelController.updateParcel,
);

router.patch(
  "/:id/cancel",
  auth(UserRole.MERCHANT),
  ParcelController.cancelParcel,
);





export const ParcelRouters = router;