import { json } from "@remix-run/node";
import { prisma as db } from "../db.server";

export async function action({ request }) {
  try {
    const order = await request.json();
    
    console.log("🧪 TEST API: Processing order...");
    console.log("📋 Order:", order.order_number);
    console.log("🏷️  Tags:", order.tags);
    
    // Simulate the shop (use a default for testing)
    const shop = "tryongoeye.myshopify.com";
    
    // Log the test
    const log = await db.webhookLog.create({
      data: {
        shop,
        webhookType: "test/order-updated",
        orderId: order.id?.toString(),
        payload: JSON.stringify(order),
        processed: false,
        success: false,
      }
    });

    console.log("📋 Webhook log created:", log.id);

    // Check for delivery tag
    const deliveryTag = checkForDeliveryTag(order);
    
    if (deliveryTag) {
      console.log(`✅ Delivery tag "${deliveryTag}" found! Creating review request...`);
      
      // Get or create default automation settings
      let settings = await db.emailAutomationSettings.findUnique({
        where: { shop }
      });

      if (!settings) {
        settings = await db.emailAutomationSettings.create({
          data: {
            shop,
            enabled: true,
            deliveryTagName: "delivered",
            delayDays: 3,
            emailProvider: "kwik-engage",
            emailSubject: "How was your recent purchase?",
            maxReminders: 1,
          }
        });
        console.log("📧 Created default automation settings");
      }

      if (settings.enabled) {
        // Create review request
        const reviewRequest = await createTestReviewRequest(shop, order, settings);
        
        // Mark webhook as successful
        await db.webhookLog.update({
          where: { id: log.id },
          data: {
            processed: true,
            success: true
          }
        });

        return json({ 
          success: true, 
          message: "Review request created successfully!",
          reviewRequest: {
            id: reviewRequest.id,
            orderNumber: reviewRequest.orderNumber,
            customerEmail: reviewRequest.customerEmail,
            scheduledSendDate: reviewRequest.scheduledSendDate,
            status: reviewRequest.status
          }
        });
      } else {
        return json({ 
          success: false, 
          message: "Email automation is disabled" 
        });
      }
    } else {
      console.log("📭 No delivery tag found, skipping review request");
      
      // Mark as processed but no action needed
      await db.webhookLog.update({
        where: { id: log.id },
        data: {
          processed: true,
          success: true
        }
      });

      return json({ 
        success: true, 
        message: "No delivery tag found, no action taken" 
      });
    }

  } catch (error) {
    console.error("❌ Test API error:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Check if order has delivery tag (simplified version)
function checkForDeliveryTag(order) {
  const tags = order.tags || "";
  const tagArray = tags.split(",").map(tag => tag.trim().toLowerCase());
  
  // Look for delivery tag (case insensitive)
  const foundTag = tagArray.find(tag => 
    tag === "delivered" ||
    tag === "order-delivered" ||
    tag === "shipped" ||
    tag.includes("deliver")
  );

  return foundTag || null;
}

// Create review request (simplified version)
async function createTestReviewRequest(shop, order, settings) {
  // Extract customer information
  const customer = order.customer || {};
  const billingAddress = order.billing_address || {};
  
  const customerEmail = customer.email || billingAddress.email || "test@example.com";
  const customerPhone = customer.phone || billingAddress.phone;
  const customerName = customer.first_name && customer.last_name 
    ? `${customer.first_name} ${customer.last_name}`
    : customer.first_name || customer.last_name || "Customer";

  // Extract product IDs from line items
  const productIds = order.line_items?.map(item => item.product_id?.toString()).filter(Boolean) || [];

  // Calculate when to send the review request
  const deliveryDate = new Date();
  const delayDays = settings.delayDays || 3;
  const scheduledSendDate = new Date(deliveryDate.getTime() + (delayDays * 24 * 60 * 60 * 1000));

  // Create the review request
  const reviewRequest = await db.reviewRequest.create({
    data: {
      shop,
      orderId: order.id.toString(),
      orderNumber: (order.order_number || order.name || "Unknown").toString(),
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
  console.log(`📧 Customer: ${customerName} (${customerEmail})`);
  console.log(`📦 Products: ${productIds.length} items`);

  return reviewRequest;
} 