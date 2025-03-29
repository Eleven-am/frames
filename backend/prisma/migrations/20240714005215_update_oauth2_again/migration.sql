/*
  Warnings:

  - Added the required column `userDataUrl` to the `OauthClient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OauthClient" ADD COLUMN     "userDataUrl" TEXT NOT NULL;
