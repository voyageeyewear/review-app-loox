// Test KwikEngage email integration
// Run with: node test-kwikengage.cjs

const http = require('http');

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

async function testKwikEngage() {
  try {
    console.log("🧪 Testing KwikEngage integration...");
    
    // Test 1: Connection test
    console.log("\n📡 Step 1: Testing connection...");
    const connectionUrl = 'http://localhost:59149/api/send-review-email?action=test-connection';
    const connectionResponse = await fetch(connectionUrl);
    const connectionResult = await connectionResponse.json();
    
    console.log("🔌 Connection test result:");
    console.log(JSON.stringify(connectionResult, null, 2));
    
    // Test 2: Send test email
    console.log("\n📧 Step 2: Sending test email...");
    
    // Replace with your actual email for testing
    const testEmailAddress = "your-email@example.com"; // CHANGE THIS!
    
    if (testEmailAddress === "your-email@example.com") {
      console.log("⚠️  Please update testEmailAddress in the script with your real email!");
      console.log("📝 Edit test-kwikengage.cjs and change line with testEmailAddress");
      return;
    }
    
    const emailData = {
      testEmail: testEmailAddress
    };
    
    const emailUrl = 'http://localhost:59149/api/send-review-email';
    console.log(`📤 Sending test email to: ${testEmailAddress}`);
    
    const emailResponse = await makeRequest(emailUrl, emailData);
    
    console.log("📊 Email test result:");
    console.log(`Status: ${emailResponse.status}`);
    console.log("Response:", JSON.stringify(emailResponse.data, null, 2));
    
    if (emailResponse.status === 200 && emailResponse.data.success) {
      console.log("\n✅ KwikEngage integration test SUCCESSFUL!");
      console.log("📧 Check your email inbox for the test review request!");
      console.log("🎯 The email should have:");
      console.log("   - Subject: 'How was your recent purchase? (Test)'");
      console.log("   - Beautiful HTML template");
      console.log("   - Review button link");
      console.log("   - Customer name: 'Test Customer'");
      console.log("   - Order number: '1001'");
    } else {
      console.log("\n❌ KwikEngage integration test FAILED");
      console.log("📋 Check the server logs for more details");
    }
    
    // Test 3: Send existing review request
    console.log("\n📋 Step 3: Testing with existing review request...");
    
    // This will send the review request we created earlier
    const reviewRequestData = {
      reviewRequestId: 1 // The ID from our earlier test
    };
    
    const reviewResponse = await makeRequest(emailUrl, reviewRequestData);
    
    console.log("📊 Review request result:");
    console.log(`Status: ${reviewResponse.status}`);
    console.log("Response:", JSON.stringify(reviewResponse.data, null, 2));

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("💡 Make sure your development server is running on port 59149");
  }
}

// Simple fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = async function(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data)
          });
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  };
}

console.log("🚀 Starting KwikEngage integration test...");
console.log("📧 This will test email sending via KwikEngage API");
console.log("🔑 Using your provided API key");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

testKwikEngage(); 