-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "cabinetId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_cabinetId_idx" ON "appointments"("cabinetId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "cabinets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
