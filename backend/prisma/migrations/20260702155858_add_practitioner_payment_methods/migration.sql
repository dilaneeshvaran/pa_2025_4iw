-- AlterTable
ALTER TABLE "saved_payment_methods" ADD COLUMN     "practitionerId" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "saved_payment_methods_practitionerId_idx" ON "saved_payment_methods"("practitionerId");

-- AddForeignKey
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
