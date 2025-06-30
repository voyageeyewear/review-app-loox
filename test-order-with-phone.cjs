// Create test order with user's phone number
// Run with: node test-order-with-phone.cjs

const http = require('http');

const testOrderWithUserPhone = {
  id: 999888777,
  order_number: 3010,
  name: "#3010",
  tags: "delivered, india-test",
  customer: {
    id: 77889,
    email: "customer@example.com",
    phone: "+918852968844", // User's phone number
    first_name: "Test",
    last_name: "Customer"
  },
  billing_address: {
    email: "customer@example.com", 
    phone: "+918852968844" // User's phone number
  },
  line_items: [
    {
      id: 1,
      product_id: 9038857732326,
      title: "Test Product for WhatsApp",
      quantity: 1,
      price: "999.00"
    }
  ],
  created_at: "2025-06-29T18:00:00Z",
  updated_at: new Date().toISOString()
};

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Shopify-Shop-Domain': 'tryongoeye.myshopify.com',
        'X-Shopify-Webhook-Id': 'test-phone-' + Date.now(),
        'X-Shopify-Topic': 'orders/updated'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function createTestOrderWithPhone() {
  console.log("📦 Creating Test Order with Your Phone Number");
  console.log("=".repeat(50));
  console.log(`📞 Phone: +918852968844`);
  console.log(`📋 Order: ${testOrderWithUserPhone.order_number}`);
  console.log(`🏷️  Tags: ${testOrderWithUserPhone.tags}`);

  try {
    const response = await makeRequest('http://localhost:55944/api/test-webhook', testOrderWithUserPhone);
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      console.log("✅ Test order created successfully!");
      
      if (response.data.reviewRequest) {
        console.log("\n📋 Review Request Details:");
        console.log(`🆔 ID: ${response.data.reviewRequest.id}`);
        console.log(`📧 Email: ${response.data.reviewRequest.customerEmail}`);
        console.log(`📱 Phone: ${response.data.reviewRequest.customerPhone}`);
        console.log(`📅 Scheduled: ${response.data.reviewRequest.scheduledSendDate}`);
        console.log(`📊 Status: ${response.data.reviewRequest.status}`);
        
        console.log("\n🎯 Next Steps:");
        console.log("1. Configure WhatsApp provider in automation settings");
        console.log("2. Go to: http://localhost:55944/app/email-automation");
        console.log("3. Look for this order in 'Recent Review Requests'");
        console.log("4. Click 'Send WhatsApp' button next to the order");
      }
    } else {
      console.log("❌ Order creation failed");
      console.log("Response:", JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("📦 Test Order Created!");
  console.log("📱 Ready for WhatsApp testing with +918852968844");
}

createTestOrderWithPhone(); 