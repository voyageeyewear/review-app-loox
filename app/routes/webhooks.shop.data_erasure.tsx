import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma as db } from "../utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  let shop: string;
  let payload: any;

  try {
    // Try to authenticate the webhook with HMAC verification
    const result = await authenticate.webhook(request);
    shop = result.shop;
    payload = result.payload;
  } catch (authError) {
    console.error("🔒 Webhook authentication failed:", authError);
    
    // Return 401 for any authentication failure (HMAC validation)
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log(`🏪 Shop Data Erasure - Shop: ${shop}`);
    
    // Parse the payload
    const shopData = payload as any;
    const shopDomain = shopData.shop_domain;
    
    console.log(`🗑️ Erasing all data for shop: ${shop} (${shopDomain})`);
    
    if (!shop) {
      console.log("❌ No shop provided in erasure request");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Delete ALL shop data from our database
    const deletionResults = {
      reviews: await db.review.deleteMany({ 
        where: { shop } 
      }),
      reviewRequests: await db.reviewRequest.deleteMany({ 
        where: { shop } 
      }),
      productGroups: await db.productGroup.deleteMany({ 
        where: { shop } 
      }),
      emailSettings: await db.emailAutomationSettings.deleteMany({ 
        where: { shop } 
      }),
      webhookLogs: await db.webhookLog.deleteMany({ 
        where: { shop } 
      }),
      sessions: await db.session.deleteMany({ 
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
    console.error("❌ Shop data erasure processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
