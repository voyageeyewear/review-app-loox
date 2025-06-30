// Test script for WhatsApp integration
// Run with: node test-whatsapp.js

const fetch = require('node-fetch'); // If using Node.js < 18

// Sample order data with delivery tag and phone number
const testOrder = {
  id: 987654321,
  order_number: 2026,
  name: "#2026", 
  tags: "delivered, whatsapp-test",
  customer: {
    id: 54321,
    email: "customer@example.com",
    phone: "+1234567890", // Include phone number for WhatsApp
    first_name: "John",
    last_name: "Doe"
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
    }
  ],
  created_at: "2025-06-29T10:00:00Z",
  updated_at: new Date().toISOString()
};

// WhatsApp provider configurations for testing
const whatsappProviders = {
  wati: {
    name: "Wati",
    apiKey: "your-wati-api-key-here",
    testEndpoint: "https://live-server.wati.io/api/v1/getTemplates"
  },
  gallabox: {
    name: "Gallabox", 
    apiKey: "your-gallabox-api-key-here",
    testEndpoint: "https://server.gallabox.com/devapi/channels"
  },
  "whatsapp-api": {
    name: "WhatsApp Business API",
    apiKey: "your-facebook-access-token-here",
    testEndpoint: "https://graph.facebook.com/v18.0/me"
  }
};

async function testWhatsAppIntegration() {
  console.log("📱 Testing WhatsApp Integration");
  console.log("=".repeat(50));

  // Test 1: Create dummy order with WhatsApp delivery
  console.log("\n1. Creating test order with delivery tag and phone number...");
  try {
    const response = await fetch('http://localhost:59149/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'tryongoeye.myshopify.com',
        'X-Shopify-Webhook-Id': 'whatsapp-test-' + Date.now(),
        'X-Shopify-Topic': 'orders/updated'
      },
      body: JSON.stringify(testOrder)
    });

    const result = await response.json();
    console.log(`✅ Test order created: ${result.success ? 'Success' : 'Failed'}`);
    if (result.reviewRequest) {
      console.log(`📋 Review request ID: ${result.reviewRequest.id}`);
      console.log(`📧 Email: ${result.reviewRequest.customerEmail}`);
      console.log(`📱 Phone: ${result.reviewRequest.customerPhone}`);
    }
  } catch (error) {
    console.log(`❌ Failed to create test order: ${error.message}`);
  }

  // Test 2: WhatsApp provider connection tests
  console.log("\n2. Testing WhatsApp provider connections...");
  
  for (const [provider, config] of Object.entries(whatsappProviders)) {
    console.log(`\n🧪 Testing ${config.name} (${provider}):`);
    
    try {
      const response = await fetch('http://localhost:59149/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test-connection',
          provider: provider,
          apiKey: config.apiKey
        })
      });

      const result = await response.json();
      console.log(`   ${result.success ? '✅' : '❌'} ${result.message || result.error}`);
      
      if (result.success) {
        console.log(`   🔗 Ready to send WhatsApp messages via ${config.name}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Connection test failed: ${error.message}`);
    }
  }

  // Test 3: Send test WhatsApp message
  console.log("\n3. Testing WhatsApp message sending...");
  const testPhone = "+1234567890"; // Replace with your test phone number
  
  try {
    const response = await fetch('http://localhost:59149/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'test-message',
        testPhone: testPhone
      })
    });

    const result = await response.json();
    console.log(`${result.success ? '✅' : '❌'} Test WhatsApp: ${result.message || result.error}`);
    
    if (result.success) {
      console.log(`📱 Message sent to: ${testPhone}`);
      console.log(`🆔 Message ID: ${result.messageId}`);
    }
    
  } catch (error) {
    console.log(`❌ WhatsApp test failed: ${error.message}`);
  }

  // Test 4: Process pending WhatsApp messages
  console.log("\n4. Testing pending WhatsApp message processing...");
  
  try {
    const response = await fetch('http://localhost:59149/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'process-pending'
      })
    });

    const result = await response.json();
    console.log(`${result.success ? '✅' : '❌'} Pending processing: ${result.message || result.error}`);
    
    if (result.success) {
      console.log(`📊 Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`);
    }
    
  } catch (error) {
    console.log(`❌ Pending processing failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("📱 WhatsApp Integration Test Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Configure WhatsApp provider in Email Automation page");
  console.log("2. Add your WhatsApp API key");
  console.log("3. Set up WhatsApp templates in your provider dashboard");
  console.log("4. Test with real phone numbers");
  console.log("5. Create Shopify orders with 'delivered' tag to trigger automation");
  console.log("\n🔗 Dashboard: http://localhost:59149/app/email-automation");
}

// WhatsApp template examples for different providers
function displayTemplateExamples() {
  console.log("\n📋 WhatsApp Template Examples:");
  console.log("=".repeat(50));
  
  console.log("\n🔸 Wati Template (review_request):");
  console.log(`Hi {{1}}! 👋

Thank you for your recent order #{{2}}! 

We'd love to hear about your experience. Your feedback helps us improve and helps other customers make informed decisions.

⭐ Please take 2 minutes to share your review:
{{3}}

Thank you for choosing us! 🙏

Best regards,
Customer Experience Team`);

  console.log("\n🔸 WhatsApp Business API Template:");
  console.log(`{
  "name": "review_request",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}}! Thank you for order #{{2}}. Please share your review: {{3}}"
    },
    {
      "type": "BUTTON",
      "sub_type": "URL",
      "url": "{{3}}"
    }
  ]
}`);

  console.log("\n🔸 Gallabox Template:");
  console.log(`Template Name: review_request
Variables: Customer Name, Order Number, Review Link
Content: Hi {{customerName}}! Thank you for order #{{orderNumber}}. Please review: {{reviewLink}}`);
}

// Run the test
if (require.main === module) {
  console.log("🚀 Starting WhatsApp Integration Tests...");
  
  // Display template examples first
  displayTemplateExamples();
  
  // Run integration tests
  testWhatsAppIntegration().catch(error => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
} 