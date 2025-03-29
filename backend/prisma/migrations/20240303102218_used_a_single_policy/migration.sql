/*
  Warnings:

  - The `access` column on the `MediaGroup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `policy` on the `SharedWith` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccessPolicy" AS ENUM ('DENY', 'READ', 'WRITE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "MediaGroup" DROP COLUMN "access",
ADD COLUMN     "access" "AccessPolicy" NOT NULL DEFAULT 'DENY';

-- AlterTable
ALTER TABLE "SharedWith" DROP COLUMN "policy",
ADD COLUMN     "access" "AccessPolicy" NOT NULL DEFAULT 'READ';

-- AlterTable
ALTER TABLE "UserGroup" ADD COLUMN     "access" "AccessPolicy" NOT NULL DEFAULT 'READ';

-- DropEnum
DROP TYPE "MediaAccessPolicy";
