/*
  Warnings:

  - Added the required column `userId` to the `CloudStorage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloudStorage" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CloudStorage" ADD CONSTRAINT "CloudStorage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
