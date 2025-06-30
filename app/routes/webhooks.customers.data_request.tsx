import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma as db } from "../utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate the webhook with HMAC verification
    const { shop, payload } = await authenticate.webhook(request);
    
    console.log(`📋 Customer Data Request - Shop: ${shop}`);
    
    // Parse the payload
    const customerData = payload as any;
    const customerId = customerData.customer?.id;
    const customerEmail = customerData.customer?.email;
    
    console.log(`🔍 Data request for customer: ${customerId} (${customerEmail})`);
    
    if (!customerId) {
      console.log("❌ No customer ID provided in data request");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Gather all customer data from our database
    const customerDataInDb = {
      reviews: await db.review.findMany({
        where: { 
          customerName: customerEmail
        }
      }),
      reviewRequests: await db.reviewRequest.findMany({
        where: { 
          customerEmail: customerEmail
        }
      })
    };
    
    // Log the data collection for compliance records
    console.log(`📊 Customer data collected:`, {
      customerId,
      customerEmail,
      reviewsCount: customerDataInDb.reviews.length,
      reviewRequestsCount: customerDataInDb.reviewRequests.length,
      timestamp: new Date().toISOString()
    });
    
    // In a production app, you would typically:
    // 1. Send this data to the customer via email
    // 2. Store the request for compliance records
    // 3. Format the data in a human-readable format
    
    // For now, we'll log that we've processed the request
    console.log("✅ Customer data request processed successfully");
    
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("❌ Customer data request webhook error:", error);
    
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