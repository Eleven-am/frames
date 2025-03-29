/*
  Warnings:

  - You are about to drop the column `base64` on the `Artwork` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mediaId,userId]` on the table `ListItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[index,playlistId]` on the table `PlaylistVideo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mediaId,userId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Artwork" DROP COLUMN "base64",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ListItem_mediaId_userId_key" ON "ListItem"("mediaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistVideo_index_playlistId_key" ON "PlaylistVideo"("index", "playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_mediaId_userId_key" ON "Rating"("mediaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
