-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "isClosedForPatient" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "conversations_isClosedForPatient_idx" ON "conversations"("isClosedForPatient");
