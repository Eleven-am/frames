/*
  Warnings:

  - The values [ONEDRIVE,BOX,MEGA,YANDEX,MEDIAFIRE] on the enum `CloudDrive` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CloudDrive_new" AS ENUM ('GDRIVE', 'DROPBOX', 'S3', 'LOCAL');
ALTER TABLE "CloudStorage" ALTER COLUMN "drive" TYPE "CloudDrive_new" USING ("drive"::text::"CloudDrive_new");
ALTER TYPE "CloudDrive" RENAME TO "CloudDrive_old";
ALTER TYPE "CloudDrive_new" RENAME TO "CloudDrive";
DROP TYPE "CloudDrive_old";
COMMIT;
