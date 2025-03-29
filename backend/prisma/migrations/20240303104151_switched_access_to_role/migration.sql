/*
  Warnings:

  - You are about to drop the column `access` on the `UserGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserGroup" DROP COLUMN "access",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
