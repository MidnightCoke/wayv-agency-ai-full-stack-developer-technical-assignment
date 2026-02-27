-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "targetCountry" TEXT NOT NULL,
    "targetGender" TEXT NOT NULL,
    "targetAgeRange" TEXT NOT NULL,
    "niches" TEXT[],
    "preferredHookTypes" TEXT[],
    "minAvgWatchTime" DOUBLE PRECISION NOT NULL,
    "budgetRange" JSONB NOT NULL,
    "tone" TEXT NOT NULL,
    "doNotUseWords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "niches" TEXT[],
    "followers" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "avgWatchTime" DOUBLE PRECISION NOT NULL,
    "contentStyle" TEXT NOT NULL,
    "primaryHookType" TEXT NOT NULL,
    "brandSafetyFlags" TEXT[],
    "audience" JSONB NOT NULL,
    "lastPosts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBriefCache" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBriefCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_username_key" ON "Creator"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AiBriefCache_campaignId_creatorId_promptHash_key" ON "AiBriefCache"("campaignId", "creatorId", "promptHash");

-- AddForeignKey
ALTER TABLE "AiBriefCache" ADD CONSTRAINT "AiBriefCache_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBriefCache" ADD CONSTRAINT "AiBriefCache_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
