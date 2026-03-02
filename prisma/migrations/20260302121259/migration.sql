-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'REQUEST';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'REQUEST';
