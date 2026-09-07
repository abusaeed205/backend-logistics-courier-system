/*
  Warnings:

  - You are about to drop the column `district` on the `merchants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "merchants" DROP COLUMN "district",
ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "upazilaId" TEXT;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
