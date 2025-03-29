/*
  Warnings:

  - You are about to drop the column `transport` on the `PassKey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PassKey" DROP COLUMN "transport",
ADD COLUMN     "transports" TEXT[];
