import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma as db } from "../utils/db.server";
import { whatsappService } from "../services/whatsapp.server.js";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate the webhook
    const { shop, payload } = await authenticate.webhook(request);
    
    console.log("📦 Order webhook received from shop:", shop);
    
    // Parse the order data
    const order = payload as any;
    
    // Log the webhook for debugging
    await db.webhookLog.create({
      data: {
        shop,
        webhookType: "order/updated",
        orderId: order.id?.toString(),
        payload: JSON.stringify(order),
        processed: false,
        success: false,
      }
    });

    console.log(`📋 Order ${order.order_number} updated - checking for delivery tag...`);

    // Check if order has delivery tag
    const deliveryTag = await checkForDeliveryTag(shop, order);
    
    if (deliveryTag) {
      console.log(`✅ Delivery tag "${deliveryTag}" found! Creating review request...`);
      await createReviewRequest(shop, order, deliveryTag);
    } else {
      console.log("📭 No delivery tag found, skipping review request");
    }

    // Mark webhook as processed
    await db.webhookLog.updateMany({
      where: {
        shop,
        orderId: order.id?.toString(),
        webhookType: "order/updated",
        processed: false
      },
      data: {
        processed: true,
        success: true
      }
    });

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    
    // Log the error
    try {
      await db.webhookLog.create({
        data: {
          shop: "unknown",
          webhookType: "order/updated",
          payload: await request.text(),
          processed: true,
          success: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error"
        }
      });
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }

    return new Response("Error", { status: 500 });
  }
}

// Check if order has delivery tag
async function checkForDeliveryTag(shop: string, order: any): Promise<string | null> {
  try {
    // Get automation settings for this shop
    const settings = await db.emailAutomationSettings.findUnique({
      where: { shop }
    });

    const deliveryTagName = settings?.deliveryTagName || "delivered";
    
    // Check if order has the delivery tag
    const tags = order.tags || "";
    const tagArray = tags.split(",").map((tag: string) => tag.trim().toLowerCase());
    
    // Look for delivery tag (case insensitive)
    const foundTag = tagArray.find((tag: string) => 
      tag === deliveryTagName.toLowerCase() ||
      tag === "delivered" ||
      tag === "order-delivered" ||
      tag === "shipped" ||
      tag.includes("deliver")
    );

    return foundTag || null;
    
  } catch (error) {
    console.error("Error checking delivery tag:", error);
    return null;
  }
}

// Create review request for delivered order
async function createReviewRequest(shop: string, order: any, deliveryTag: string) {
  try {
    // Get automation settings
    const settings = await db.emailAutomationSettings.findUnique({
      where: { shop }
    });

    if (!settings?.enabled) {
      console.log("📭 Email automation disabled for this shop");
      return;
    }

    // Check if review request already exists
    const existingRequest = await db.reviewRequest.findUnique({
      where: {
        shop_orderId: {
          shop,
          orderId: order.id.toString()
        }
      }
    });

    if (existingRequest) {
      console.log("📋 Review request already exists for this order");
      return;
    }

    // Extract customer information
    const customer = order.customer || {};
    const billingAddress = order.billing_address || {};
    
    const customerEmail = customer.email || billingAddress.email;
    const customerPhone = customer.phone || billingAddress.phone;
    const customerName = customer.first_name && customer.last_name 
      ? `${customer.first_name} ${customer.last_name}`
      : customer.first_name || customer.last_name || "Customer";

    if (!customerEmail) {
      console.log("❌ No customer email found, cannot create review request");
      return;
    }

    // Extract product IDs from line items
    const productIds = order.line_items?.map((item: any) => item.product_id?.toString()).filter(Boolean) || [];

    // Calculate when to send the review request
    const deliveryDate = new Date();
    const delayDays = settings.delayDays || 3;
    const delayHours = settings.delayHours || 0;
    const delaySeconds = settings.delaySeconds || 0;
    
    // Calculate total delay in milliseconds
    const totalDelayMs = (delayDays * 24 * 60 * 60 * 1000) + 
                        (delayHours * 60 * 60 * 1000) + 
                        (delaySeconds * 1000);
    
    const scheduledSendDate = new Date(deliveryDate.getTime() + totalDelayMs);

    // Create the review request
    const reviewRequest = await db.reviewRequest.create({
      data: {
        shop,
        orderId: order.id.toString(),
        orderNumber: order.order_number || order.name || "Unknown",
        customerEmail,
        customerPhone,
        customerName,
        productIds: JSON.stringify(productIds),
        deliveryDate,
        scheduledSendDate,
        status: "pending",
        emailProvider: settings.emailProvider,
      }
    });

    console.log(`✅ Review request created for order ${order.order_number}`);
    console.log(`📅 Scheduled to send on: ${scheduledSendDate.toISOString()}`);
    console.log(`⏰ Delay: ${delayDays} days, ${delayHours} hours, ${delaySeconds} seconds`);
    console.log(`📧 Customer: ${customerName} (${customerEmail})`);
    console.log(`📱 Phone: ${customerPhone || 'N/A'}`);
    console.log(`📦 Products: ${productIds.length} items`);

    // If WhatsApp is configured and no delay, send immediately
    if (settings.whatsappProvider && settings.whatsappApiKey && totalDelayMs === 0 && customerPhone) {
      console.log("📱 WhatsApp configured with no delay - sending immediately...");
      try {
        const whatsappSettings = {
          ...settings,
          whatsappApiKey: settings.whatsappApiKey
        };
        await whatsappService.sendReviewRequest(reviewRequest, whatsappSettings);
      } catch (whatsappError) {
        console.error("❌ Immediate WhatsApp send failed:", whatsappError);
      }
    }

    return reviewRequest;

  } catch (error) {
    console.error("❌ Error creating review request:", error);
    throw error;
  }
} 