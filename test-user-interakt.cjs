// Test with user's Interakt API key
const http = require('http');

const INTERAKT_API_KEY = "bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo=";
const TEST_PHONE = "+918852968844";

console.log("🔐 Testing Your Interakt API Key");
console.log("=".repeat(40));
console.log("🔑 API Key: " + INTERAKT_API_KEY.substring(0, 20) + "...");
console.log("📞 Phone: " + TEST_PHONE);
console.log("");
console.log("🎯 NEXT STEPS:");
console.log("1. Go to: http://localhost:55944/app/email-automation");
console.log("2. Select 'Interakt' from WhatsApp Provider");
console.log("3. Paste this API Key:");
console.log("");
console.log("📋 " + INTERAKT_API_KEY);
console.log("");
console.log("4. Click 'Test Connection'");
console.log("5. Click 'Send Test WhatsApp' with +918852968844");
console.log("6. Find Order #3010 and click 'Send WhatsApp'");
console.log("");
console.log("✅ Your Interakt API is ready to configure!");
