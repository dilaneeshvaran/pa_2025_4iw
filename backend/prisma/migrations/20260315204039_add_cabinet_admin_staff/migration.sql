/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,email]` on the table `campaign_recipients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `campaign_recipients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CampaignTargetType" ADD VALUE 'ALL_PRACTITIONERS';
ALTER TYPE "CampaignTargetType" ADD VALUE 'ALL_USERS';
ALTER TYPE "CampaignTargetType" ADD VALUE 'CUSTOM';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContactRequestType" ADD VALUE 'PRACTITIONER';
ALTER TYPE "ContactRequestType" ADD VALUE 'CABINET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'CHECK';
ALTER TYPE "PaymentMethod" ADD VALUE 'TRANSFER';
ALTER TYPE "PaymentMethod" ADD VALUE 'OTHER';
ALTER TYPE "PaymentMethod" ADD VALUE 'ONLINE';

-- AlterEnum
ALTER TYPE "TeleconsultationStatus" ADD VALUE 'NO_SHOW';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CABINET_ADMIN';

-- DropIndex
DROP INDEX "campaign_recipients_campaignId_patientId_key";

-- AlterTable
ALTER TABLE "campaign_recipients" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "practitionerId" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY['EMAIL']::TEXT[],
ADD COLUMN     "failedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'INFO',
ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetRegisteredFrom" TIMESTAMP(3),
ADD COLUMN     "targetRegisteredTo" TIMESTAMP(3),
ADD COLUMN     "targetUserTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalRecipients" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "adminContactEmail" TEXT,
ADD COLUMN     "adminContactName" TEXT,
ADD COLUMN     "adminContactPhone" TEXT,
ADD COLUMN     "cabinetAddress" TEXT,
ADD COLUMN     "cabinetName" TEXT,
ADD COLUMN     "cabinetRccm" TEXT,
ADD COLUMN     "cabinetRegDocPath" TEXT,
ADD COLUMN     "clinicAddress" TEXT,
ADD COLUMN     "diplomaPath" TEXT,
ADD COLUMN     "identityDocumentPath" TEXT,
ADD COLUMN     "orderAttestationPath" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ALTER COLUMN "postalCode" DROP NOT NULL,
ALTER COLUMN "specialty" DROP NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedById" TEXT,
ADD COLUMN     "lastWarningAt" TIMESTAMP(3),
ADD COLUMN     "penaltyReason" TEXT,
ADD COLUMN     "warningCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "practitioners" ADD COLUMN     "acceptedPaymentMethods" "PaymentMethod"[],
ADD COLUMN     "bankInfo" JSONB,
ADD COLUMN     "emergencyFee" DECIMAL(10,2),
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "noShowAutoBlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noShowPenaltyDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "noShowThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "cabinetId" TEXT,
ALTER COLUMN "practitionerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teleconsultation_sessions" ADD COLUMN     "auditLog" JSONB,
ADD COLUMN     "chatMessages" JSONB,
ADD COLUMN     "noShowMarkedBy" TEXT,
ADD COLUMN     "screenSharingUsed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "cabinets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "phone" TEXT,
    "rccm" TEXT,
    "adminUserId" TEXT,
    "adminContactName" TEXT NOT NULL,
    "adminContactEmail" TEXT NOT NULL,
    "adminContactPhone" TEXT NOT NULL,
    "registrationDocPath" TEXT,
    "openHours" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "contactRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cabinets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabinet_practitioners" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "cabinet_practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cabinet_invitations" (
    "id" TEXT NOT NULL,
    "cabinetId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cabinet_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'PREMIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cabinets_adminUserId_key" ON "cabinets"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "cabinets_contactRequestId_key" ON "cabinets"("contactRequestId");

-- CreateIndex
CREATE INDEX "cabinets_name_idx" ON "cabinets"("name");

-- CreateIndex
CREATE INDEX "cabinets_adminUserId_idx" ON "cabinets"("adminUserId");

-- CreateIndex
CREATE INDEX "cabinet_practitioners_cabinetId_idx" ON "cabinet_practitioners"("cabinetId");

-- CreateIndex
CREATE INDEX "cabinet_practitioners_practitionerId_idx" ON "cabinet_practitioners"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "cabinet_practitioners_cabinetId_practitionerId_key" ON "cabinet_practitioners"("cabinetId", "practitionerId");

-- CreateIndex
CREATE INDEX "cabinet_invitations_cabinetId_idx" ON "cabinet_invitations"("cabinetId");

-- CreateIndex
CREATE INDEX "cabinet_invitations_practitionerId_idx" ON "cabinet_invitations"("practitionerId");

-- CreateIndex
CREATE INDEX "cabinet_invitations_email_idx" ON "cabinet_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cabinet_invitations_cabinetId_practitionerId_key" ON "cabinet_invitations"("cabinetId", "practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_practitionerId_key" ON "subscriptions"("practitionerId");

-- CreateIndex
CREATE INDEX "subscriptions_practitionerId_idx" ON "subscriptions"("practitionerId");

-- CreateIndex
CREATE INDEX "campaign_recipients_practitionerId_idx" ON "campaign_recipients"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipients_campaignId_email_key" ON "campaign_recipients"("campaignId", "email");

-- CreateIndex
CREATE INDEX "staff_cabinetId_idx" ON "staff"("cabinetId");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabinets" ADD CONSTRAINT "cabinets_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabinet_practitioners" ADD CONSTRAINT "cabinet_practitioners_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabinet_practitioners" ADD CONSTRAINT "cabinet_practitioners_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabinet_invitations" ADD CONSTRAINT "cabinet_invitations_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cabinet_invitations" ADD CONSTRAINT "cabinet_invitations_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
