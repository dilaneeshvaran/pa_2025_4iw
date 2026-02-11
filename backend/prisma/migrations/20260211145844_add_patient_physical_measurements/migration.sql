-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "height" DECIMAL(5,2),
ADD COLUMN     "surgicalOperations" TEXT[],
ADD COLUMN     "weight" DECIMAL(5,2);
