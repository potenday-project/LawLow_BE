/*
  Warnings:

  - The primary key for the `Oauthid` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Oauthid" DROP CONSTRAINT "Oauthid_pkey",
ADD COLUMN     "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(0),
ADD COLUMN     "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "Oauthid_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(0),
ADD COLUMN     "updated_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP;
