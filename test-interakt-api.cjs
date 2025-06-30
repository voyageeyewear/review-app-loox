// Test with user's Interakt API key
// Run with: node test-interakt-api.cjs

const http = require('http');

const INTERAKT_API_KEY = "bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo=";
const TEST_PHONE = "+918852968844";

function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
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

async function testWithUserAPI() {
  console.log("🔐 Testing Your Interakt API Key");
  console.log("=".repeat(40));
  console.log(`🔑 API Key: ${INTERAKT_API_KEY.substring(0, 20)}...`);
  console.log(`📞 Phone: ${TEST_PHONE}`);
  console.log("");

  // Step 1: Test connection
  try {
    console.log("🧪 Step 1: Testing Interakt connection...");
    
    const connectionTest = await makeRequest('http://localhost:55944/api/send-whatsapp', {
      action: 'test-connection',
      provider: 'interakt',
      apiKey: INTERAKT_API_KEY
    });

    console.log(`📊 Connection Status: ${connectionTest.status}`);
    console.log(`📋 Response:`, JSON.stringify(connectionTest.data, null, 2));

    if (connectionTest.data.success) {
      console.log("✅ Interakt connection successful!");
      
      console.log("\n📱 Step 2: Sending test WhatsApp message...");
      
      const testMessage = await makeRequest('http://localhost:55944/api/send-whatsapp', {
        action: 'test-message',
        testPhone: TEST_PHONE
      });

      console.log(`📊 WhatsApp Status: ${testMessage.status}`);
      console.log(`📋 Response:`, JSON.stringify(testMessage.data, null, 2));

      if (testMessage.data.success) {
        console.log(`✅ WhatsApp sent successfully to ${TEST_PHONE}!`);
        console.log(`🆔 Message ID: ${testMessage.data.messageId || 'N/A'}`);
      } else {
        console.log(`❌ WhatsApp failed: ${testMessage.data.error}`);
        
        if (testMessage.data.error && testMessage.data.error.includes('not configured')) {
          console.log("\n💡 Configure Interakt first in the dashboard");
        }
      }

    } else {
      console.log(`❌ Interakt connection failed: ${connectionTest.data.error}`);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(40));
  console.log("🎯 NEXT STEPS:");
  console.log("1. Go to: http://localhost:55944/app/email-automation");
  console.log("2. Select 'Interakt' from WhatsApp Provider");
  console.log("3. Paste API Key: " + INTERAKT_API_KEY);
  console.log("4. Click 'Test Connection'");
  console.log("5. Click 'Send Test WhatsApp' with +918852968844");
  console.log("6. Find Order #3010 and click 'Send WhatsApp'");
  console.log("");
  console.log("📋 Your API Key (copy this): " + INTERAKT_API_KEY);
}

// Run the test
testWithUserAPI(); 