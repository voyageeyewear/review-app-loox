import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Use Shopify's webhook authentication with HMAC verification
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    console.log(`📋 Customer Data Request - Shop: ${shop}, Topic: ${topic}`);
    
    // Parse the payload
    const customerData = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const customerId = customerData.customer?.id;
    const customerEmail = customerData.customer?.email;
    
    console.log(`🔍 Data request for customer: ${customerId} (${customerEmail})`);
    
    if (!customerId) {
      console.log("❌ No customer ID provided in data request");
      return new Response("Bad Request", { status: 400 });
    }
    
    // Gather all customer data from our database
    const customerDataInDb = {
      reviews: await prisma.review.findMany({
        where: { 
          // Reviews are linked by customerName, we'll search by email if it matches name
          customerName: customerEmail
        }
      }),
      reviewRequests: await prisma.reviewRequest.findMany({
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
    return new Response("Internal Server Error", { status: 500 });
  }
}; 