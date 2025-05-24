-- CreateTable
CREATE TABLE "Metadata" (
    "fileId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_fileId_key" ON "Metadata"("fileId");
