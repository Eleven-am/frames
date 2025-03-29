/*
  Warnings:

  - You are about to drop the column `description` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `access` on the `MediaGroup` table. All the data in the column will be lost.
  - You are about to drop the column `created` on the `MediaGroup` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `MediaGroup` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `MediaGroup` table. All the data in the column will be lost.
  - You are about to drop the column `updated` on the `MediaGroup` table. All the data in the column will be lost.
  - You are about to drop the column `created` on the `UserGroup` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `UserGroup` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `UserGroup` table. All the data in the column will be lost.
  - You are about to drop the column `updated` on the `UserGroup` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserGroup` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mediaGroupId,userGroupId]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mediaGroupId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userGroupId` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `MediaGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `UserGroup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuthKey" DROP CONSTRAINT "AuthKey_groupId_fkey";

-- DropForeignKey
ALTER TABLE "MediaGroup" DROP CONSTRAINT "MediaGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "MediaGroup" DROP CONSTRAINT "MediaGroup_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_userId_fkey";

-- DropIndex
DROP INDEX "Group_name_key";

-- DropIndex
DROP INDEX "MediaGroup_mediaId_groupId_key";

-- DropIndex
DROP INDEX "UserGroup_userId_groupId_key";

-- AlterTable
ALTER TABLE "AuthKey" ADD COLUMN     "userGroupId" TEXT;

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "description",
ADD COLUMN     "access" "AccessPolicy" NOT NULL DEFAULT 'READ',
ADD COLUMN     "mediaGroupId" TEXT NOT NULL,
ADD COLUMN     "userGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MediaGroup" DROP COLUMN "access",
DROP COLUMN "created",
DROP COLUMN "groupId",
DROP COLUMN "mediaId",
DROP COLUMN "updated",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserGroup" DROP COLUMN "created",
DROP COLUMN "groupId",
DROP COLUMN "role",
DROP COLUMN "updated",
DROP COLUMN "userId",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_UserGroupLink" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MediaGroupLink" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserGroupLink_AB_unique" ON "_UserGroupLink"("A", "B");

-- CreateIndex
CREATE INDEX "_UserGroupLink_B_index" ON "_UserGroupLink"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MediaGroupLink_AB_unique" ON "_MediaGroupLink"("A", "B");

-- CreateIndex
CREATE INDEX "_MediaGroupLink_B_index" ON "_MediaGroupLink"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Group_mediaGroupId_userGroupId_key" ON "Group"("mediaGroupId", "userGroupId");

-- AddForeignKey
ALTER TABLE "AuthKey" ADD CONSTRAINT "AuthKey_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_mediaGroupId_fkey" FOREIGN KEY ("mediaGroupId") REFERENCES "MediaGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroupLink" ADD CONSTRAINT "_UserGroupLink_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroupLink" ADD CONSTRAINT "_UserGroupLink_B_fkey" FOREIGN KEY ("B") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MediaGroupLink" ADD CONSTRAINT "_MediaGroupLink_A_fkey" FOREIGN KEY ("A") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MediaGroupLink" ADD CONSTRAINT "_MediaGroupLink_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
