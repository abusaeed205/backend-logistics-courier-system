import { ParcelType, PaymentType } from "../../../../prisma/generated/prisma/enums";



export interface ICreateParcel {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientDistrict: string;
  recipientThana?: string;
  recipientUnionId: string;
  parcelType?: ParcelType;
  weightKg: number;
  description?: string;
  paymentType?: PaymentType;
  codAmount?: number;
  deliveryCharge: number;
}

export interface IUpdateParcel {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientDistrict?: string;
  recipientThana?: string;
  parcelType?: ParcelType;
  weightKg?: number;
  description?: string;
}




export interface IGetMyParcel {
  status?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}