-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT false;
