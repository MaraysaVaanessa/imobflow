/*
  Warnings:

  - A unique constraint covering the columns `[cpf,companyId]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,companyId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Contract` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Maintenance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Owner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Tenant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Maintenance" DROP CONSTRAINT "Maintenance_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Owner" DROP CONSTRAINT "Owner_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_companyId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Maintenance" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Owner" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_cpf_companyId_key" ON "Owner"("cpf", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cpf_companyId_key" ON "Tenant"("cpf", "companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
