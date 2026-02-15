-- AlterTable: Add type, practitioner2Id to conversations, make patientId nullable
ALTER TABLE "conversations" ADD COLUMN "type" "ConversationType" NOT NULL DEFAULT 'PATIENT_PRACTITIONER';
ALTER TABLE "conversations" ALTER COLUMN "patientId" DROP NOT NULL;
ALTER TABLE "conversations" ADD COLUMN "practitioner2Id" TEXT;

-- CreateIndex
CREATE INDEX "conversations_practitioner2Id_idx" ON "conversations"("practitioner2Id");
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_practitioner2Id_fkey" FOREIGN KEY ("practitioner2Id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: conversation_user_settings
CREATE TABLE "conversation_user_settings" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailMuted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_user_settings_conversationId_userId_key" ON "conversation_user_settings"("conversationId", "userId");
CREATE INDEX "conversation_user_settings_userId_idx" ON "conversation_user_settings"("userId");

-- AddForeignKey
ALTER TABLE "conversation_user_settings" ADD CONSTRAINT "conversation_user_settings_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
