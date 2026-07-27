-- CreateEnum
CREATE TYPE "MedibotConvStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "MedibotMessageRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL', 'SYSTEM');

-- CreateTable
CREATE TABLE "medibot_conversations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "patientId" TEXT,
    "status" "MedibotConvStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medibot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medibot_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MedibotMessageRole" NOT NULL,
    "content" TEXT,
    "actions" JSONB,
    "toolCalls" JSONB,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medibot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medibot_conversations_sessionId_idx" ON "medibot_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "medibot_conversations_patientId_idx" ON "medibot_conversations"("patientId");

-- CreateIndex
CREATE INDEX "medibot_messages_conversationId_idx" ON "medibot_messages"("conversationId");

-- AddForeignKey
ALTER TABLE "medibot_conversations" ADD CONSTRAINT "medibot_conversations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medibot_messages" ADD CONSTRAINT "medibot_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "medibot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
