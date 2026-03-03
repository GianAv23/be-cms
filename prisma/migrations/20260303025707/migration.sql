/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `ads` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `news` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ads" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "news" DROP COLUMN "deleted_at";
