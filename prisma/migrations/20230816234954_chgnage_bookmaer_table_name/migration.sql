/*
  Warnings:

  - You are about to drop the `UserLawBookmark` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserLawBookmark" DROP CONSTRAINT "UserLawBookmark_user_id_fkey";

-- DropTable
DROP TABLE "UserLawBookmark";

-- CreateTable
CREATE TABLE "LawBookmark" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "law_type" "LawType" NOT NULL,
    "law_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "LawBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LawBookmark_user_id_law_type_index" ON "LawBookmark"("user_id", "law_type");

-- CreateIndex
CREATE UNIQUE INDEX "LawBookmark_user_id_law_id_key" ON "LawBookmark"("user_id", "law_id");

-- AddForeignKey
ALTER TABLE "LawBookmark" ADD CONSTRAINT "LawBookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
