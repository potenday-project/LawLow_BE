-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oauthid" (
    "id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,

    CONSTRAINT "Oauthid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Oauthid_provider_id_key" ON "Oauthid"("provider", "id");

-- AddForeignKey
ALTER TABLE "Oauthid" ADD CONSTRAINT "Oauthid_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
