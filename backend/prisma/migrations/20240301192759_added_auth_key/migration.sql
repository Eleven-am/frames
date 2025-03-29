/*
  Warnings:

  - Added the required column `authKeyId` to the `Download` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Download" ADD COLUMN     "authKeyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_authKeyId_fkey" FOREIGN KEY ("authKeyId") REFERENCES "AuthKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
