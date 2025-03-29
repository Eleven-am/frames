-- DropIndex
DROP INDEX "UserGroupLink_userGroupId_userId_key";

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "backdrop" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "UserGroupLink" ADD CONSTRAINT "UserGroupLink_pkey" PRIMARY KEY ("userGroupId", "userId");
