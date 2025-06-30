// Test script to simulate Shopify order webhook
// Run with: node test-webhook.js

const fetch = require('node-fetch');

// Sample order data with delivery tag
const testOrder = {
  id: 123456789,
  order_number: 1001,
  name: "#1001",
  tags: "delivered, express-shipping",
  customer: {
    id: 12345,
    email: "customer@example.com",
    first_name: "John",
    last_name: "Doe",
    phone: "+1234567890"
  },
  billing_address: {
    email: "customer@example.com",
    phone: "+1234567890"
  },
  line_items: [
    {
      id: 1,
      product_id: 9038857732326,
      title: "iPhone 15 Pro - Pink",
      quantity: 1,
      price: "999.00"
    },
    {
      id: 2,
      product_id: 9038857732327,
      title: "iPhone 15 Pro Case",
      quantity: 1,
      price: "49.00"
    }
  ],
  created_at: "2025-06-28T10:00:00Z",
  updated_at: new Date().toISOString()
};

async function testWebhook() {
  try {
    console.log("🧪 Testing webhook with sample order...");
    console.log("📋 Order:", testOrder.order_number);
    console.log("🏷️  Tags:", testOrder.tags);
    console.log("📧 Customer:", testOrder.customer.email);
    
    // Replace with your actual webhook URL
    const webhookUrl = 'http://localhost:61254/webhooks/orders/updated';
    
    console.log(`📡 Sending to: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'tryongoeye.myshopify.com',
        'X-Shopify-Webhook-Id': 'test-webhook-' + Date.now(),
        'X-Shopify-Triggered-At': new Date().toISOString(),
        'X-Shopify-Topic': 'orders/updated'
      },
      body: JSON.stringify(testOrder)
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      console.log("✅ Webhook test successful!");
      console.log("📋 Check your admin dashboard to see the review request created.");
    } else {
      console.log("❌ Webhook test failed:");
      console.log(await response.text());
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testWebhook(); 