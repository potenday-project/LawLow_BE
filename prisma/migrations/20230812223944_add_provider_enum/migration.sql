/*
  Warnings:

  - Changed the type of `provider` on the `Oauthid` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google');

-- AlterTable
ALTER TABLE "Oauthid" DROP COLUMN "provider",
ADD COLUMN     "provider" "Provider" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Oauthid_provider_id_key" ON "Oauthid"("provider", "id");
