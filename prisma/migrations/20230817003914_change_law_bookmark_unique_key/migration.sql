/*
  Warnings:

  - A unique constraint covering the columns `[user_id,law_id,law_type]` on the table `LawBookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LawBookmark_user_id_law_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "LawBookmark_user_id_law_id_law_type_key" ON "LawBookmark"("user_id", "law_id", "law_type");
