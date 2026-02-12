-- CreateTable
CREATE TABLE "practitioner_todos" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practitioner_todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "practitioner_todos_practitionerId_idx" ON "practitioner_todos"("practitionerId");

-- CreateIndex
CREATE INDEX "practitioner_todos_completed_idx" ON "practitioner_todos"("completed");

-- AddForeignKey
ALTER TABLE "practitioner_todos" ADD CONSTRAINT "practitioner_todos_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
