// Test Interakt WhatsApp integration
// Run with: node test-interakt-whatsapp.cjs

const http = require('http');

const testPhoneNumber = "+918852968844"; // User's phone number

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

async function testInteraktWhatsApp() {
  console.log("📱 Testing Interakt WhatsApp Integration");
  console.log("=".repeat(50));
  console.log(`📞 Phone Number: ${testPhoneNumber}`);
  console.log(`🇮🇳 Country: India (+91)`);
  console.log("");

  console.log("📋 Interakt Setup Instructions:");
  console.log("=".repeat(30));
  console.log("1. Login to Interakt dashboard: https://app.interakt.ai");
  console.log("2. Go to Settings → API & Webhooks");
  console.log("3. Copy your API key");
  console.log("4. Create a WhatsApp template named 'review_request'");
  console.log("5. Template example:");
  console.log("   Hi {{1}}! Thanks for order #{{2}}. Please review: {{3}}");
  console.log("6. Get template approved by WhatsApp");
  console.log("");

  console.log("🎯 Test Steps:");
  console.log("=".repeat(30));
  console.log("1. Go to: http://localhost:55944/app/email-automation");
  console.log("2. Select 'Interakt' from WhatsApp Provider dropdown");
  console.log("3. Enter your Interakt API key");
  console.log("4. Click 'Test Connection'");
  console.log("5. Click 'Send Test WhatsApp' and enter: +918852968844");
  console.log("");

  // Try to send test with whatever configuration exists
  try {
    console.log("🚀 Attempting to send test WhatsApp via Interakt...");
    
    const response = await makeRequest('http://localhost:55944/api/send-whatsapp', {
      action: 'test-message',
      testPhone: testPhoneNumber
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.success) {
      console.log("✅ WhatsApp message sent successfully via Interakt!");
      console.log(`📱 Sent to: ${testPhoneNumber}`);
      if (response.data.messageId) {
        console.log(`🆔 Message ID: ${response.data.messageId}`);
      }
    } else {
      console.log("❌ WhatsApp test failed!");
      console.log(`❗ Error: ${response.data.error || response.data.message}`);
      
      if (response.data.error && response.data.error.includes('WhatsApp provider not configured')) {
        console.log("\n💡 Configure Interakt first:");
        console.log("1. Go to: http://localhost:55944/app/email-automation");
        console.log("2. Select 'Interakt' provider");
        console.log("3. Enter your API key");
        console.log("4. Test connection and then send WhatsApp");
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log("\n💡 Make sure your development server is running:");
    console.log("   npm run dev");
  }

  console.log("\n" + "=".repeat(50));
  console.log("📱 Interakt WhatsApp Test Complete!");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("1. Get your Interakt API key");
  console.log("2. Go to dashboard: http://localhost:55944/app/email-automation");
  console.log("3. Configure Interakt as WhatsApp provider");
  console.log("4. Send test WhatsApp to +918852968844");
  console.log("5. Check that test order #3010 has your phone number");
  console.log("");
  console.log("📋 Interakt Template Format:");
  console.log("Template Name: review_request");
  console.log("Language: English (en)");
  console.log("Category: MARKETING");
  console.log("Template: Hi {{1}}! Thank you for your recent order #{{2}}!");
  console.log("          We'd love your feedback: {{3}}");
  console.log("          Thank you! 🙏");
}

// Run the test
testInteraktWhatsApp(); 