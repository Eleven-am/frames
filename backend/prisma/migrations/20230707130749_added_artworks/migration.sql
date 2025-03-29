-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "base64" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
