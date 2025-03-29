-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UseCase" AS ENUM ('SIGNUP', 'DOWNLOAD');

-- CreateEnum
CREATE TYPE "PickType" AS ENUM ('BASIC', 'EDITOR');

-- CreateEnum
CREATE TYPE "Generator" AS ENUM ('FRAMES', 'USER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'GUEST', 'OAUTH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CastType" AS ENUM ('ACTOR', 'DIRECTOR', 'WRITER', 'PRODUCER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SHOW');

-- CreateEnum
CREATE TYPE "CloudDrive" AS ENUM ('GDRIVE', 'ONEDRIVE', 'DROPBOX', 'BOX', 'MEGA', 'YANDEX', 'MEDIAFIRE', 'LOCAL');

-- CreateEnum
CREATE TYPE "PlaylistPolicy" AS ENUM ('READ', 'WRITE', 'DELETE');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRODUCTION', 'DISTRIBUTION');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "valid" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "browserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthKey" (
    "id" TEXT NOT NULL,
    "authKey" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useCase" "UseCase" NOT NULL DEFAULT 'SIGNUP',
    "updated" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "viewId" TEXT,

    CONSTRAINT "AuthKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "type" "CompanyType" NOT NULL,
    "logo" VARCHAR(250) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMedia" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentifier" (
    "id" TEXT NOT NULL,
    "browserName" TEXT NOT NULL,
    "osName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "type" "PickType" NOT NULL DEFAULT 'EDITOR',
    "category" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "episode" INTEGER NOT NULL,
    "showId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "cloudStorageId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Frame" (
    "id" TEXT NOT NULL,
    "cypher" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "accessed" INTEGER NOT NULL DEFAULT 0,
    "viewId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Frame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListItem" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "rate" BOOLEAN NOT NULL DEFAULT true,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistVideo" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "generator" "Generator" NOT NULL DEFAULT 'FRAMES',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedWith" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "policy" "PlaylistPolicy" NOT NULL DEFAULT 'READ',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedWith_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "times" DOUBLE PRECISION NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "inform" BOOLEAN NOT NULL DEFAULT true,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "confirmedEmail" BOOLEAN NOT NULL DEFAULT false,
    "confirmToken" TEXT,
    "defaultLang" TEXT NOT NULL DEFAULT 'none',
    "channel" TEXT NOT NULL,
    "incognito" BOOLEAN NOT NULL DEFAULT false,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "cloudStorageId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtitle" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "vtt" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "Subtitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "episodeId" TEXT,
    "playlistId" TEXT,
    "inform" BOOLEAN NOT NULL DEFAULT true,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watched" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mediaId" TEXT NOT NULL,
    "episodeId" TEXT,
    "times" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watched_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeenMedia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "times" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeenMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "poster" VARCHAR(250) NOT NULL,
    "posterBlur" TEXT NOT NULL,
    "backdrop" VARCHAR(250) NOT NULL,
    "backdropBlur" TEXT NOT NULL,
    "portrait" VARCHAR(250) NOT NULL,
    "portraitBlur" TEXT NOT NULL,
    "logo" VARCHAR(250),
    "logoBlur" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'MOVIE',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "genres" TEXT[],
    "releaseDate" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "character" TEXT,
    "job" TEXT,
    "type" "CastType" NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudStorage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "drive" "CloudDrive" NOT NULL,
    "credentials" JSONB NOT NULL,
    "token" JSONB NOT NULL,
    "modify" BOOLEAN NOT NULL DEFAULT false,
    "movieLocations" TEXT[],
    "showLocations" TEXT[],
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEmbeds" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "vector" vector,

    CONSTRAINT "MediaEmbeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmbeds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "vector" vector,

    CONSTRAINT "UserEmbeds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_key" ON "Session"("session");

-- CreateIndex
CREATE UNIQUE INDEX "AuthKey_authKey_key" ON "AuthKey"("authKey");

-- CreateIndex
CREATE UNIQUE INDEX "Company_tmdbId_type_key" ON "Company"("tmdbId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentifier_sessionId_key" ON "UserIdentifier"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_videoId_key" ON "Episode"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_season_episode_showId_key" ON "Episode"("season", "episode", "showId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_location_key" ON "Folder"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_mediaId_key" ON "Folder"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Frame_cypher_key" ON "Frame"("cypher");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWith_userId_playlistId_key" ON "SharedWith"("userId", "playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Video_location_key" ON "Video"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Download_location_key" ON "Download"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Watched_userId_videoId_key" ON "Watched"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "SeenMedia_mediaId_userId_key" ON "SeenMedia"("mediaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_tmdbId_type_key" ON "Media"("tmdbId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "MediaEmbeds_mediaId_key" ON "MediaEmbeds"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmbeds_userId_key" ON "UserEmbeds"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthKey" ADD CONSTRAINT "AuthKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthKey" ADD CONSTRAINT "AuthKey_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMedia" ADD CONSTRAINT "CompanyMedia_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMedia" ADD CONSTRAINT "CompanyMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentifier" ADD CONSTRAINT "UserIdentifier_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentifier" ADD CONSTRAINT "UserIdentifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_cloudStorageId_fkey" FOREIGN KEY ("cloudStorageId") REFERENCES "CloudStorage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Frame" ADD CONSTRAINT "Frame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Frame" ADD CONSTRAINT "Frame_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVideo" ADD CONSTRAINT "PlaylistVideo_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistVideo" ADD CONSTRAINT "PlaylistVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWith" ADD CONSTRAINT "SharedWith_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedWith" ADD CONSTRAINT "SharedWith_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_cloudStorageId_fkey" FOREIGN KEY ("cloudStorageId") REFERENCES "CloudStorage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtitle" ADD CONSTRAINT "Subtitle_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "PlaylistVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeenMedia" ADD CONSTRAINT "SeenMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeenMedia" ADD CONSTRAINT "SeenMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEmbeds" ADD CONSTRAINT "MediaEmbeds_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmbeds" ADD CONSTRAINT "UserEmbeds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
