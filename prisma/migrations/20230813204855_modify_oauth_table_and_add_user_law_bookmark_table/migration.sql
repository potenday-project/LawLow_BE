/*
  Warnings:

  - You are about to drop the `Oauthid` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LawType" AS ENUM ('prec', 'statute');

-- DropForeignKey
ALTER TABLE "Oauthid" DROP CONSTRAINT "Oauthid_user_id_fkey";

-- DropTable
DROP TABLE "Oauthid";

-- CreateTable
CREATE TABLE "UserOauth" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "oauth_id" VARCHAR(255) NOT NULL,
    "provider" "Provider" NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "UserOauth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLawBookmark" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "law_type" "LawType" NOT NULL,
    "law_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "UserLawBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOauth_oauth_id_provider_key" ON "UserOauth"("oauth_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserLawBookmark_user_id_law_id_key" ON "UserLawBookmark"("user_id", "law_id");

-- AddForeignKey
ALTER TABLE "UserOauth" ADD CONSTRAINT "UserOauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLawBookmark" ADD CONSTRAINT "UserLawBookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
