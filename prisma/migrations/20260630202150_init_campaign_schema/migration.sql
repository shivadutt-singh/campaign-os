-- CreateTable
CREATE TABLE "CampaignSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "budgetPayload" TEXT NOT NULL,
    "projectedRevenue" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
