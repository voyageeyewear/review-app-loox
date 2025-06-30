-- CreateTable
CREATE TABLE "ReviewRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerName" TEXT NOT NULL,
    "productIds" TEXT NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "scheduledSendDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "emailProvider" TEXT,
    "errorMessage" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailAutomationSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryTagName" TEXT NOT NULL DEFAULT 'delivered',
    "delayDays" INTEGER NOT NULL DEFAULT 3,
    "emailProvider" TEXT NOT NULL DEFAULT 'klaviyo',
    "whatsappProvider" TEXT,
    "emailSubject" TEXT NOT NULL DEFAULT 'How was your recent purchase?',
    "emailTemplate" TEXT,
    "whatsappTemplate" TEXT,
    "apiKey" TEXT,
    "webhookSecret" TEXT,
    "maxReminders" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "webhookType" TEXT NOT NULL,
    "orderId" TEXT,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRequest_shop_orderId_key" ON "ReviewRequest"("shop", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAutomationSettings_shop_key" ON "EmailAutomationSettings"("shop");
