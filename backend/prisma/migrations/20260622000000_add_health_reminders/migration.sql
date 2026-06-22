-- CreateEnum
CREATE TYPE "HealthReminderStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HealthReminderRecurrenceType" AS ENUM ('INTERVAL', 'WEEKDAYS');

-- CreateEnum
CREATE TYPE "HealthReminderIntervalUnit" AS ENUM ('DAY', 'WEEK');

-- CreateEnum
CREATE TYPE "HealthReminderDurationUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'HEALTH_REMINDER';

-- CreateTable
CREATE TABLE "health_reminders" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "times" TEXT[] NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "HealthReminderDurationUnit" NOT NULL,
    "recurrenceType" "HealthReminderRecurrenceType" NOT NULL,
    "intervalValue" INTEGER,
    "intervalUnit" "HealthReminderIntervalUnit",
    "daysOfWeek" "DayOfWeek"[] NOT NULL DEFAULT ARRAY[]::"DayOfWeek"[],
    "status" "HealthReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_reminder_deliveries" (
    "id" TEXT NOT NULL,
    "healthReminderId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "notificationId" TEXT,
    "notificationAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_reminder_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_reminders_patientId_status_endDate_idx" ON "health_reminders"("patientId", "status", "endDate");

-- CreateIndex
CREATE INDEX "health_reminders_practitionerId_patientId_idx" ON "health_reminders"("practitionerId", "patientId");

-- CreateIndex
CREATE INDEX "health_reminders_status_startDate_endDate_idx" ON "health_reminders"("status", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "health_reminder_deliveries_healthReminderId_scheduledFor_key" ON "health_reminder_deliveries"("healthReminderId", "scheduledFor");

-- CreateIndex
CREATE INDEX "health_reminder_deliveries_scheduledFor_idx" ON "health_reminder_deliveries"("scheduledFor");

-- CreateIndex
CREATE INDEX "health_reminder_deliveries_healthReminderId_idx" ON "health_reminder_deliveries"("healthReminderId");

-- AddForeignKey
ALTER TABLE "health_reminders" ADD CONSTRAINT "health_reminders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_reminders" ADD CONSTRAINT "health_reminders_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_reminder_deliveries" ADD CONSTRAINT "health_reminder_deliveries_healthReminderId_fkey" FOREIGN KEY ("healthReminderId") REFERENCES "health_reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
