/*
  Warnings:

  - Added the required column `index` to the `PlaylistVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlaylistVideo" ADD COLUMN     "index" INTEGER NOT NULL;
