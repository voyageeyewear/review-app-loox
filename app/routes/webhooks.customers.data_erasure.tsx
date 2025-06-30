import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma as db } from "../utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate the webhook with HMAC verification
    const { shop, payload } = await authenticate.webhook(request);
    
    console.log(`🗑️ Customer Data Erasure - Shop: ${shop}`);
    
    // Parse the payload
    const customerData = payload as any;
    const customerId = customerData.customer?.id;
    const customerEmail = customerData.customer?.email;
    
    console.log(`🗑️ Erasing data for customer: ${customerId} (${customerEmail})`);
    
    if (!customerId || !customerEmail) {
      console.log("❌ No customer ID or email provided in erasure request");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Delete all customer data from our database
    const deletionResults = {
      reviews: await db.review.deleteMany({
        where: { 
          customerName: customerEmail
        }
      }),
      reviewRequests: await db.reviewRequest.deleteMany({
        where: { 
          customerEmail: customerEmail
        }
      })
    };
    
    // Log the deletion for compliance records
    console.log(`🗑️ Customer data erased:`, {
      customerId,
      customerEmail,
      reviewsDeleted: deletionResults.reviews.count,
      reviewRequestsDeleted: deletionResults.reviewRequests.count,
      timestamp: new Date().toISOString()
    });
    
    console.log("✅ Customer data erasure completed successfully");
    
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("❌ Customer data erasure webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
