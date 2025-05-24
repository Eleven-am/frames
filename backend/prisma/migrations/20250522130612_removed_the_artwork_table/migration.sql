/*
  Warnings:

  - You are about to drop the `Artwork` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Artwork" DROP CONSTRAINT "Artwork_videoId_fkey";

-- DropTable
DROP TABLE "Artwork";
