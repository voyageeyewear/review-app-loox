import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Use Shopify's webhook authentication with HMAC verification
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log(`🏪 Shop Data Erasure - Shop: ${shop}, Topic: ${topic}`);
    
    // Parse the payload
    const shopData = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const shopDomain = shopData.shop_domain;
    
    console.log(`🗑️ Erasing all data for shop: ${shop} (${shopDomain})`);
    
    if (!shop) {
      console.log("❌ No shop provided in erasure request");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Delete ALL shop data from our database
    const deletionResults = {
      reviews: await prisma.review.deleteMany({ 
        where: { shop } 
      }),
      reviewRequests: await prisma.reviewRequest.deleteMany({ 
        where: { shop } 
      }),
      productGroups: await prisma.productGroup.deleteMany({ 
        where: { shop } 
      }),
      emailSettings: await prisma.emailAutomationSettings.deleteMany({ 
        where: { shop } 
      }),
      webhookLogs: await prisma.webhookLog.deleteMany({ 
        where: { shop } 
      }),
      sessions: await prisma.session.deleteMany({ 
        where: { shop } 
      })
    };
    
    // Log the deletion for compliance records
    console.log(`🗑️ Shop data erased:`, {
      shop,
      shopDomain,
      reviewsDeleted: deletionResults.reviews.count,
      reviewRequestsDeleted: deletionResults.reviewRequests.count,
      productGroupsDeleted: deletionResults.productGroups.count,
      emailSettingsDeleted: deletionResults.emailSettings.count,
      webhookLogsDeleted: deletionResults.webhookLogs.count,
      sessionsDeleted: deletionResults.sessions.count,
      timestamp: new Date().toISOString()
    });
    
    console.log("✅ Shop data erasure completed successfully");
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("❌ Shop data erasure webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
