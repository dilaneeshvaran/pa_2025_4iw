-- AlterTable: Add messagingEnabled to practitioners
ALTER TABLE "practitioners" ADD COLUMN "messagingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: conversations
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: conversations
CREATE INDEX "conversations_patientId_idx" ON "conversations"("patientId");
CREATE INDEX "conversations_practitionerId_idx" ON "conversations"("practitionerId");
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
CREATE UNIQUE INDEX "conversations_patientId_practitionerId_key" ON "conversations"("patientId", "practitionerId");

-- AddForeignKey: conversations
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing messages data:
-- 1. Create conversations for existing sender/recipient pairs
INSERT INTO "conversations" ("id", "patientId", "practitionerId", "lastMessageAt", "updatedAt", "createdAt")
SELECT 
    gen_random_uuid()::TEXT,
    m."senderId",
    m."recipientId",
    MAX(m."createdAt"),
    NOW(),
    MIN(m."createdAt")
FROM "messages" m
GROUP BY m."senderId", m."recipientId"
ON CONFLICT ("patientId", "practitionerId") DO NOTHING;

-- 2. Add new columns to messages (nullable first)
ALTER TABLE "messages" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "messages" ADD COLUMN "senderUserId" TEXT;

-- 3. Populate new columns from existing data
UPDATE "messages"
SET 
    "conversationId" = c."id",
    "senderUserId" = p."userId"
FROM "conversations" c, "patients" p
WHERE c."patientId" = "messages"."senderId" 
  AND c."practitionerId" = "messages"."recipientId"
  AND p."id" = "messages"."senderId";

-- 4. Drop old columns and constraints
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_senderId_fkey";
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_recipientId_fkey";
DROP INDEX IF EXISTS "messages_senderId_idx";
DROP INDEX IF EXISTS "messages_recipientId_idx";
ALTER TABLE "messages" DROP COLUMN "senderId";
ALTER TABLE "messages" DROP COLUMN "recipientId";
ALTER TABLE "messages" DROP COLUMN "appointmentId";

-- 5. Delete any orphaned messages (where conversationId is still null)
DELETE FROM "messages" WHERE "conversationId" IS NULL;

-- 6. Make columns required
ALTER TABLE "messages" ALTER COLUMN "conversationId" SET NOT NULL;
ALTER TABLE "messages" ALTER COLUMN "senderUserId" SET NOT NULL;

-- 7. Create new indexes and foreign key
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX "messages_senderUserId_idx" ON "messages"("senderUserId");
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
