-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT false;
