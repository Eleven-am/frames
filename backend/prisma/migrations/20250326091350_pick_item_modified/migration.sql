/*
  Warnings:

  - A unique constraint covering the columns `[mediaId,categoryId]` on the table `PickItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayOrder` to the `PickItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PickItem" ADD COLUMN     "displayOrder" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PickItem_mediaId_categoryId_key" ON "PickItem"("mediaId", "categoryId");
