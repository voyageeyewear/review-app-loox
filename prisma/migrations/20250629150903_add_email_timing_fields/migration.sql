-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailAutomationSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryTagName" TEXT NOT NULL DEFAULT 'delivered',
    "delayDays" INTEGER NOT NULL DEFAULT 3,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
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
INSERT INTO "new_EmailAutomationSettings" ("apiKey", "createdAt", "delayDays", "deliveryTagName", "emailProvider", "emailSubject", "emailTemplate", "enabled", "id", "maxReminders", "shop", "updatedAt", "webhookSecret", "whatsappProvider", "whatsappTemplate") SELECT "apiKey", "createdAt", "delayDays", "deliveryTagName", "emailProvider", "emailSubject", "emailTemplate", "enabled", "id", "maxReminders", "shop", "updatedAt", "webhookSecret", "whatsappProvider", "whatsappTemplate" FROM "EmailAutomationSettings";
DROP TABLE "EmailAutomationSettings";
ALTER TABLE "new_EmailAutomationSettings" RENAME TO "EmailAutomationSettings";
CREATE UNIQUE INDEX "EmailAutomationSettings_shop_key" ON "EmailAutomationSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
