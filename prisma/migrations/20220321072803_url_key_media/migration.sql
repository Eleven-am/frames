/*
  Warnings:

  - A unique constraint covering the columns `[urlKey]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `urlKey` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "urlKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Media_urlKey_key" ON "Media"("urlKey");
