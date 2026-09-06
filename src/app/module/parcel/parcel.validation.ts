import { z } from "zod";
import { ParcelType, PaymentType } from "../../../../prisma/generated/prisma/enums";

const createParcelZodSchema = z.object({
  body: z.object({
    recipientName: z.string({ error: "Recipient name is required" }),
    recipientPhone: z.string({ error: "Recipient phone is required" }),
    recipientAddress: z.string({ error: "Recipient address is required" }),
    recipientDistrict: z.string({ error: "Recipient district is required" }),
    recipientThana: z.string().optional(),
    parcelType: z.nativeEnum(ParcelType).optional(),
    weightKg: z.number({ error: "Weight is required" }).positive(),
    description: z.string().optional(),
    paymentType: z.nativeEnum(PaymentType).optional(),
    codAmount: z.number().nonnegative().optional(),
    deliveryCharge: z.number({ error: "Delivery charge is required" }).nonnegative(),
  }),
});

export const ParcelValidation = {
  createParcelZodSchema,
};