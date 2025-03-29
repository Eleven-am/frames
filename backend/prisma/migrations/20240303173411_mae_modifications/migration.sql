/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_mediaGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_userGroupId_fkey";

-- DropTable
DROP TABLE "Group";

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mediaGroupId" TEXT NOT NULL,
    "userGroupId" TEXT NOT NULL,
    "access" "AccessPolicy" NOT NULL DEFAULT 'READ',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_mediaGroupId_userGroupId_key" ON "Policy"("mediaGroupId", "userGroupId");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_mediaGroupId_fkey" FOREIGN KEY ("mediaGroupId") REFERENCES "MediaGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
