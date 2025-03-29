/*
  Warnings:

  - You are about to drop the `_UserGroupLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserGroupLink" DROP CONSTRAINT "_UserGroupLink_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserGroupLink" DROP CONSTRAINT "_UserGroupLink_B_fkey";

-- DropTable
DROP TABLE "_UserGroupLink";

-- CreateTable
CREATE TABLE "UserGroupLink" (
    "userGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupAccess" "AccessPolicy" NOT NULL DEFAULT 'READ'
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGroupLink_userGroupId_userId_key" ON "UserGroupLink"("userGroupId", "userId");

-- AddForeignKey
ALTER TABLE "UserGroupLink" ADD CONSTRAINT "UserGroupLink_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupLink" ADD CONSTRAINT "UserGroupLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
