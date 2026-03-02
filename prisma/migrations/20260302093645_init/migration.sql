-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'NEWS_EDITOR', 'ADS_EDITOR', 'DELETED');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "AdsCategory" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ImageExtension" AS ENUM ('JPG', 'PNG', 'JPEG');

-- CreateEnum
CREATE TYPE "ImageCategory" AS ENUM ('NEWS_IMAGE', 'ADS_IMAGE');

-- CreateTable
CREATE TABLE "user" (
    "uuid" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(64) NOT NULL,
    "full_name" TEXT NOT NULL,
    "password" VARCHAR(64) NOT NULL,
    "roles" "Roles"[],
    "session_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "news" (
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "external_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "news_image" (
    "uuid" TEXT NOT NULL,
    "news_uuid" TEXT NOT NULL,
    "fileType" "ImageExtension" NOT NULL,
    "link" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_image_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "admin_news" (
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "news_uuid" TEXT NOT NULL,
    "created_by" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_news_pkey" PRIMARY KEY ("user_uuid","news_uuid")
);

-- CreateTable
CREATE TABLE "ads" (
    "uuid" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "category" "AdsCategory" NOT NULL,
    "partner_name" TEXT,
    "external_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ads_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ads_image" (
    "uuid" TEXT NOT NULL,
    "ads_uuid" TEXT NOT NULL,
    "fileType" "ImageExtension" NOT NULL,
    "link" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_image_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "news_image_news_uuid_key" ON "news_image"("news_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ads_image_ads_uuid_key" ON "ads_image"("ads_uuid");

-- AddForeignKey
ALTER TABLE "news_image" ADD CONSTRAINT "news_image_news_uuid_fkey" FOREIGN KEY ("news_uuid") REFERENCES "news"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_news" ADD CONSTRAINT "admin_news_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_news" ADD CONSTRAINT "admin_news_news_uuid_fkey" FOREIGN KEY ("news_uuid") REFERENCES "news"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_image" ADD CONSTRAINT "ads_image_ads_uuid_fkey" FOREIGN KEY ("ads_uuid") REFERENCES "ads"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
