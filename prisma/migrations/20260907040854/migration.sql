-- AlterEnum
ALTER TYPE "ParcelStatus" ADD VALUE 'CREATED';

-- AlterTable
ALTER TABLE "parcels" ALTER COLUMN "currentStatus" SET DEFAULT 'CREATED';
