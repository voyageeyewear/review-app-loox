// Test WhatsApp message to specific number
// Run with: node test-whatsapp-specific.cjs

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

async function sendTestWhatsApp() {
  console.log("📱 Sending Test WhatsApp Message");
  console.log("=".repeat(40));
  console.log(`📞 Phone Number: ${testPhoneNumber}`);
  console.log(`🇮🇳 Country: India (+91)`);
  console.log("");

  try {
    // Send test WhatsApp message
    console.log("🚀 Sending test WhatsApp message...");
    
    const response = await makeRequest('http://localhost:55944/api/send-whatsapp', {
      action: 'test-message',
      testPhone: testPhoneNumber
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.success) {
      console.log("✅ WhatsApp message sent successfully!");
      console.log(`📱 Sent to: ${testPhoneNumber}`);
      if (response.data.messageId) {
        console.log(`🆔 Message ID: ${response.data.messageId}`);
      }
      console.log(`📨 Message: ${response.data.message}`);
    } else {
      console.log("❌ WhatsApp message failed!");
      console.log(`❗ Error: ${response.data.error || response.data.message}`);
      
      // Check if WhatsApp provider is configured
      if (response.data.error && response.data.error.includes('WhatsApp provider not configured')) {
        console.log("\n💡 Setup Instructions:");
        console.log("1. Go to: http://localhost:56052/app/email-automation");
        console.log("2. Select a WhatsApp provider (Wati, Gallabox, or WhatsApp Business API)");
        console.log("3. Enter your API key");
        console.log("4. Test the connection");
        console.log("5. Then try sending the message again");
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log("\n💡 Make sure your development server is running:");
    console.log("   npm run dev");
    console.log("   Server should be running on http://localhost:56052");
  }

  console.log("\n" + "=".repeat(40));
  console.log("📱 Test Complete!");
}

// Run the test
sendTestWhatsApp(); 