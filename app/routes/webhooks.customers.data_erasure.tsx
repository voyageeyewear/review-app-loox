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
    
    console.log(`🔥 Erasing data for customer: ${customerId} (${customerEmail})`);
    
    if (!customerId && !customerEmail) {
      console.log("❌ No customer ID or email provided for erasure");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Delete all customer data from our database
    const deletedData = await db.$transaction(async (prisma) => {
      // Delete reviews
      const deletedReviews = await prisma.review.deleteMany({
        where: { 
          customerName: customerEmail
        }
      });
      
      // Delete review requests
      const deletedRequests = await prisma.reviewRequest.deleteMany({
        where: { 
          customerEmail: customerEmail
        }
      });
      
      return {
        reviewsDeleted: deletedReviews.count,
        reviewRequestsDeleted: deletedRequests.count
      };
    });
    
    // Log the erasure for compliance records
    console.log(`🧹 Customer data erased:`, {
      customerId,
      customerEmail,
      reviewsDeleted: deletedData.reviewsDeleted,
      reviewRequestsDeleted: deletedData.reviewRequestsDeleted,
      timestamp: new Date().toISOString()
    });
    
    console.log("✅ Customer data erasure completed successfully");
    
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("❌ Customer data erasure webhook error:", error);
    
    // Check if it's an authentication/HMAC error
    if (error instanceof Error && (
      error.message.includes("Unauthorized") ||
      error.message.includes("HMAC") ||
      error.message.includes("Invalid webhook") ||
      error.message.includes("authentication")
    )) {
      console.log("🔒 HMAC validation failed - returning 401");
      return new Response("Unauthorized", { status: 401 });
    }
    
    return new Response("Internal Server Error", { status: 500 });
  }
}
