-- AlterTable
ALTER TABLE "absences" ADD COLUMN     "cabinetId" TEXT;

-- AlterTable
ALTER TABLE "availabilities" ADD COLUMN     "cabinetId" TEXT;

-- AlterTable
ALTER TABLE "blocked_slots" ADD COLUMN     "cabinetId" TEXT;

-- CreateIndex
CREATE INDEX "absences_cabinetId_idx" ON "absences"("cabinetId");

-- CreateIndex
CREATE INDEX "availabilities_cabinetId_idx" ON "availabilities"("cabinetId");

-- CreateIndex
CREATE INDEX "blocked_slots_cabinetId_idx" ON "blocked_slots"("cabinetId");

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
