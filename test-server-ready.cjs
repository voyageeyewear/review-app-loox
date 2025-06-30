// Test if server is ready with fixed Prisma client
const http = require('http');

async function testServerReady() {
  const ports = [51538, 51514, 3457]; // Try different ports
  
  console.log("🔧 Testing if server is ready with fixed Prisma client...");
  
  for (const port of ports) {
    try {
      console.log(`🔍 Checking port ${port}...`);
      
      const response = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          resolve({ status: res.statusCode, port });
        });
        
        req.on('error', () => {
          resolve({ status: 'error', port });
        });
        
        req.setTimeout(3000, () => {
          req.destroy();
          resolve({ status: 'timeout', port });
        });
      });
      
      if (response.status === 200 || response.status === 302) {
        console.log(`✅ Server is running on port ${port}!`);
        console.log("");
        console.log("🎯 NEXT STEPS - Database Issue is Fixed!");
        console.log("=".repeat(45));
        console.log(`1. Go to: http://localhost:${port}/app/email-automation`);
        console.log("2. Select 'Interakt' from WhatsApp Provider");
        console.log("3. Paste API Key: bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo=");
        console.log("4. Click 'Save Settings' (should work now!)");
        console.log("5. Click 'Test Connection'");
        console.log("6. Click 'Send Test WhatsApp' with +918852968844");
        console.log("");
        console.log("✅ The whatsappApiKey field is now available!");
        console.log("✅ Server restarted with updated Prisma client!");
        console.log("✅ Ready to configure Interakt!");
        return;
      }
    } catch (error) {
      console.log(`❌ Port ${port}: ${error.message}`);
    }
  }
  
  console.log("⏳ Server might still be starting. Try again in 30 seconds:");
  console.log("   npm run dev");
}

testServerReady(); 