-- AlterTable
ALTER TABLE "absences" ADD COLUMN     "notifiedPatients" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "practitioners" ADD COLUMN     "backToBack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "breakBetweenSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancellationNotice" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "emergencySlotsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeVisitEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxBookingAdvance" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "minBookingNotice" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "newPatientMaxPerDay" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "blocked_slots" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_slots_practitionerId_idx" ON "blocked_slots"("practitionerId");

-- CreateIndex
CREATE INDEX "blocked_slots_date_idx" ON "blocked_slots"("date");

-- AddForeignKey
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
