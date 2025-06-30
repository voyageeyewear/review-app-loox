import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Try to authenticate the webhook with HMAC verification
    const { shop, payload } = await authenticate.webhook(request);
    
    console.log(`🗑️ Customer Data Erasure - Shop: ${shop}`);
    console.log("✅ HMAC validation passed - returning 200");
    
    return new Response("OK", { status: 200 });
    
  } catch (authError) {
    console.error("🔒 Webhook authentication failed:", authError);
    console.log("❌ HMAC validation failed - returning 401");
    
    // Return 401 for any authentication failure (HMAC validation)
    return new Response("Unauthorized", { status: 401 });
  }
}
