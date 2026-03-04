-- AlterTable
ALTER TABLE "news" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "news_image_gallery" (
    "uuid" TEXT NOT NULL,
    "news_uuid" TEXT NOT NULL,
    "fileType" "ImageExtension" NOT NULL,
    "link" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_image_gallery_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_image_gallery_link_key" ON "news_image_gallery"("link");

-- AddForeignKey
ALTER TABLE "news_image_gallery" ADD CONSTRAINT "news_image_gallery_news_uuid_fkey" FOREIGN KEY ("news_uuid") REFERENCES "news"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
