-- CreateTable
CREATE TABLE "OauthClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "tokenUrl" TEXT NOT NULL,
    "authorizationURL" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OauthClient_pkey" PRIMARY KEY ("id")
);
