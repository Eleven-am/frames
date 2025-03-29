/*
  Warnings:

  - A unique constraint covering the columns `[credentialId,email]` on the table `PassKey` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subtitle" ADD COLUMN     "subtitles" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "PassKey_credentialId_email_key" ON "PassKey"("credentialId", "email");
