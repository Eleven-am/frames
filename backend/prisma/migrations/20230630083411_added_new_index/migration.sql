/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Playlist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Playlist_userId_name_key" ON "Playlist"("userId", "name");
