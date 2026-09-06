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

export const ParcelRouters = router;