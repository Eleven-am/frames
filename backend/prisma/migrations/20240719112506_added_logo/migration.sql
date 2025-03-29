/*
  Warnings:

  - Added the required column `logo` to the `OauthClient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OauthClient" ADD COLUMN     "logo" TEXT NOT NULL;
