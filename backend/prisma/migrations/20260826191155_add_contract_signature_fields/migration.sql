-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "signatureStatus" TEXT NOT NULL DEFAULT 'nao_enviado',
ADD COLUMN     "signedDocumentUrl" TEXT;
