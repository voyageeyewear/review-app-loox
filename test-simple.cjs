// Simple test for the API endpoint
// Run with: node test-simple.cjs

const http = require('http');

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
  line_items: [
    {
      id: 1,
      product_id: 9038857732326,
      title: "iPhone 15 Pro - Pink",
      quantity: 1,
      price: "999.00"
    }
  ]
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
        'Content-Length': Buffer.byteLength(postData)
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
        } catch (e) {
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

async function testAPI() {
  try {
    console.log("🧪 Testing simple API...");
    console.log("📋 Order:", testOrder.order_number);
    console.log("��️  Tags:", testOrder.tags);
    
    const apiUrl = 'http://localhost:59149/api/test-webhook';
    console.log(`📡 Sending to: ${apiUrl}`);
    
    const response = await makeRequest(apiUrl, testOrder);

    console.log(`📊 Response status: ${response.status}`);
    console.log("📋 Response:", JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log("✅ Test successful!");
      console.log("🔗 Check dashboard: http://localhost:59149/app/email-automation");
    } else {
      console.log("❌ Test failed");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAPI();
