/*
  Warnings:

  - You are about to drop the `Pick` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pick" DROP CONSTRAINT "Pick_mediaId_fkey";

-- AlterTable
ALTER TABLE "_MediaGroupLink" ADD CONSTRAINT "_MediaGroupLink_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MediaGroupLink_AB_unique";

-- DropTable
DROP TABLE "Pick";

-- CreateTable
CREATE TABLE "PickCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PickType" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickItem" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickCategory_name_key" ON "PickCategory"("name");

-- AddForeignKey
ALTER TABLE "PickItem" ADD CONSTRAINT "PickItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PickCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickItem" ADD CONSTRAINT "PickItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
