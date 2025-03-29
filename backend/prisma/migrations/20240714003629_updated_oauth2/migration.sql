/*
  Warnings:

  - You are about to drop the column `authorizationURL` on the `OauthClient` table. All the data in the column will be lost.
  - You are about to drop the column `callbackUrl` on the `OauthClient` table. All the data in the column will be lost.
  - You are about to drop the column `tokenUrl` on the `OauthClient` table. All the data in the column will be lost.
  - Added the required column `authorizeHost` to the `OauthClient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorizePath` to the `OauthClient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHost` to the `OauthClient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenPath` to the `OauthClient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OauthClient" DROP COLUMN "authorizationURL",
DROP COLUMN "callbackUrl",
DROP COLUMN "tokenUrl",
ADD COLUMN     "authorizeHost" TEXT NOT NULL,
ADD COLUMN     "authorizePath" TEXT NOT NULL,
ADD COLUMN     "scopes" TEXT[],
ADD COLUMN     "tokenHost" TEXT NOT NULL,
ADD COLUMN     "tokenPath" TEXT NOT NULL;
