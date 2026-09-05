-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MERCHANT', 'PICKUP_RIDER', 'DELIVERY_RIDER', 'BRANCH_AGENT', 'HUB_AGENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('BRANCH', 'HUB');

-- CreateEnum
CREATE TYPE "RiderType" AS ENUM ('PICKUP', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "RiderAvailability" AS ENUM ('AVAILABLE', 'ON_DUTY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('PICKUP_REQUESTED', 'RIDER_ASSIGNED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN_BRANCH', 'PROCESSING_AT_ORIGIN_HUB', 'READY_FOR_TRANSIT', 'IN_TRANSIT_TO_HUB', 'RECEIVED_AT_HUB', 'PROCESSING_FOR_DESTINATION_HUB', 'IN_TRANSIT_TO_DESTINATION_HUB', 'RECEIVED_AT_DESTINATION_HUB', 'IN_TRANSIT_TO_DELIVERY_BRANCH', 'RECEIVED_AT_DELIVERY_BRANCH', 'ASSIGNED_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED_TO_BRANCH', 'RETURN_INITIATED', 'RETURN_IN_TRANSIT', 'RETURNED_TO_MERCHANT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParcelType" AS ENUM ('DOCUMENT', 'PARCEL', 'FRAGILE', 'HEAVY');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('COD', 'PREPAID');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('OPEN', 'CLOSED', 'IN_TRANSIT', 'RECEIVED');

-- CreateEnum
CREATE TYPE "ManifestLegType" AS ENUM ('PICKUP_TO_ORIGIN_BRANCH', 'BRANCH_TO_HUB', 'HUB_TO_HUB', 'HUB_TO_DELIVERY_BRANCH', 'RETURN');

-- CreateEnum
CREATE TYPE "TrackingEventActorType" AS ENUM ('RIDER', 'BRANCH_AGENT', 'HUB_AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CodCollectionStatus" AS ENUM ('COLLECTED', 'DEPOSITED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'INCLUDED_IN_SETTLEMENT', 'SETTLED');

-- CreateEnum
CREATE TYPE "SettlementMethod" AS ENUM ('BANK', 'BKASH', 'NAGAD', 'ROCKET', 'CASH');

-- CreateEnum
CREATE TYPE "CodPaymentMethod" AS ENUM ('CASH', 'BKASH', 'NAGAD');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryFailureReason" AS ENUM ('CUSTOMER_UNREACHABLE', 'CUSTOMER_NOT_AVAILABLE', 'WRONG_ADDRESS', 'CUSTOMER_REFUSED', 'COD_NOT_READY', 'OTHER');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BranchType" NOT NULL,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "unionId" TEXT,
    "address" TEXT NOT NULL,
    "parentHubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifests" (
    "id" TEXT NOT NULL,
    "manifestCode" TEXT NOT NULL,
    "legType" "ManifestLegType" NOT NULL,
    "originBranchId" TEXT NOT NULL,
    "destinationBranchId" TEXT NOT NULL,
    "status" "ManifestStatus" NOT NULL DEFAULT 'OPEN',
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "closedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_parcels" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifest_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "thana" TEXT,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "defaultDeliveryCharge" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_ledger_entries" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "parcelId" TEXT,
    "settlementId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "recipientUnionId" TEXT,
    "parcelType" "ParcelType" NOT NULL DEFAULT 'PARCEL',
    "weightKg" DECIMAL(6,2) NOT NULL,
    "description" TEXT,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'COD',
    "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currentStatus" "ParcelStatus" NOT NULL DEFAULT 'PICKUP_REQUESTED',
    "originBranchId" TEXT,
    "destinationBranchId" TEXT,
    "currentBranchId" TEXT,
    "pickupRiderId" TEXT,
    "deliveryRiderId" TEXT,
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailureReason" "DeliveryFailureReason",
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "method" "SettlementMethod" NOT NULL,
    "referenceNo" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "status" "ParcelStatus" NOT NULL,
    "note" TEXT,
    "branchId" TEXT,
    "actorType" "TrackingEventActorType" NOT NULL,
    "scannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upazilas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upazilas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ZoneUnions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ZoneUnions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RiderZones" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RiderZones_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "branches_divisionId_idx" ON "branches"("divisionId");

-- CreateIndex
CREATE INDEX "branches_districtId_idx" ON "branches"("districtId");

-- CreateIndex
CREATE INDEX "branches_upazilaId_idx" ON "branches"("upazilaId");

-- CreateIndex
CREATE INDEX "branches_unionId_idx" ON "branches"("unionId");

-- CreateIndex
CREATE INDEX "branches_type_idx" ON "branches"("type");

-- CreateIndex
CREATE UNIQUE INDEX "branch_staff_userId_key" ON "branch_staff"("userId");

-- CreateIndex
CREATE INDEX "branch_staff_branchId_idx" ON "branch_staff"("branchId");

-- CreateIndex
CREATE INDEX "delivery_zones_branchId_idx" ON "delivery_zones"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "manifests_manifestCode_key" ON "manifests"("manifestCode");

-- CreateIndex
CREATE INDEX "manifests_status_idx" ON "manifests"("status");

-- CreateIndex
CREATE INDEX "manifests_originBranchId_destinationBranchId_idx" ON "manifests"("originBranchId", "destinationBranchId");

-- CreateIndex
CREATE INDEX "manifest_parcels_parcelId_idx" ON "manifest_parcels"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_parcels_manifestId_parcelId_key" ON "manifest_parcels"("manifestId", "parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_userId_key" ON "merchants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_ledger_entries_parcelId_key" ON "merchant_ledger_entries"("parcelId");

-- CreateIndex
CREATE INDEX "merchant_ledger_entries_merchantId_idx" ON "merchant_ledger_entries"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_trackingCode_key" ON "parcels"("trackingCode");

-- CreateIndex
CREATE INDEX "parcels_merchantId_idx" ON "parcels"("merchantId");

-- CreateIndex
CREATE INDEX "parcels_currentStatus_idx" ON "parcels"("currentStatus");

-- CreateIndex
CREATE INDEX "parcels_trackingCode_idx" ON "parcels"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "payments_parcelId_key" ON "payments"("parcelId");

-- CreateIndex
CREATE INDEX "payments_branchId_idx" ON "payments"("branchId");

-- CreateIndex
CREATE INDEX "payments_riderId_idx" ON "payments"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "riders_userId_key" ON "riders"("userId");

-- CreateIndex
CREATE INDEX "riders_branchId_idx" ON "riders"("branchId");

-- CreateIndex
CREATE INDEX "settlements_merchantId_status_idx" ON "settlements"("merchantId", "status");

-- CreateIndex
CREATE INDEX "tracking_events_parcelId_createdAt_idx" ON "tracking_events"("parcelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "districts_divisionId_idx" ON "districts"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_divisionId_key" ON "districts"("name", "divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");

-- CreateIndex
CREATE INDEX "unions_upazilaId_idx" ON "unions"("upazilaId");

-- CreateIndex
CREATE UNIQUE INDEX "unions_name_upazilaId_key" ON "unions"("name", "upazilaId");

-- CreateIndex
CREATE INDEX "upazilas_districtId_idx" ON "upazilas"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "upazilas_name_districtId_key" ON "upazilas"("name", "districtId");

-- CreateIndex
CREATE INDEX "_ZoneUnions_B_index" ON "_ZoneUnions"("B");

-- CreateIndex
CREATE INDEX "_RiderZones_B_index" ON "_RiderZones"("B");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "unions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_parentHubId_fkey" FOREIGN KEY ("parentHubId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff" ADD CONSTRAINT "branch_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff" ADD CONSTRAINT "branch_staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_originBranchId_fkey" FOREIGN KEY ("originBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_destinationBranchId_fkey" FOREIGN KEY ("destinationBranchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_parcels" ADD CONSTRAINT "manifest_parcels_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_parcels" ADD CONSTRAINT "manifest_parcels_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ledger_entries" ADD CONSTRAINT "merchant_ledger_entries_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ledger_entries" ADD CONSTRAINT "merchant_ledger_entries_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_ledger_entries" ADD CONSTRAINT "merchant_ledger_entries_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_recipientUnionId_fkey" FOREIGN KEY ("recipientUnionId") REFERENCES "unions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_originBranchId_fkey" FOREIGN KEY ("originBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_destinationBranchId_fkey" FOREIGN KEY ("destinationBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_currentBranchId_fkey" FOREIGN KEY ("currentBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_pickupRiderId_fkey" FOREIGN KEY ("pickupRiderId") REFERENCES "riders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_deliveryRiderId_fkey" FOREIGN KEY ("deliveryRiderId") REFERENCES "riders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "riders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unions" ADD CONSTRAINT "unions_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upazilas" ADD CONSTRAINT "upazilas_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ZoneUnions" ADD CONSTRAINT "_ZoneUnions_A_fkey" FOREIGN KEY ("A") REFERENCES "delivery_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ZoneUnions" ADD CONSTRAINT "_ZoneUnions_B_fkey" FOREIGN KEY ("B") REFERENCES "unions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RiderZones" ADD CONSTRAINT "_RiderZones_A_fkey" FOREIGN KEY ("A") REFERENCES "delivery_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RiderZones" ADD CONSTRAINT "_RiderZones_B_fkey" FOREIGN KEY ("B") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
