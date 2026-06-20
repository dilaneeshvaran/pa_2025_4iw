-- AlterTable
ALTER TABLE "practitioners" ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
