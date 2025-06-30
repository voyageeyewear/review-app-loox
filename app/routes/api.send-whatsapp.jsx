import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma as db } from "../utils/db.server";
import { whatsappService } from "../services/whatsapp.server.js";

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    
    const body = await request.json();
    const { action, reviewRequestId, testPhone, provider, apiKey } = body;

    console.log("📱 WhatsApp API called with action:", action);

    // Test WhatsApp connection
    if (action === "test-connection") {
      if (!provider || !apiKey) {
        return json({ 
          success: false, 
          error: "Provider and API key are required for testing" 
        });
      }

      console.log(`🧪 Testing ${provider} connection...`);
      const result = await whatsappService.testConnection(provider, apiKey);
      
      return json({
        success: result.success,
        message: result.success ? result.message : result.error,
        provider: result.provider
      });
    }

    // Send test WhatsApp message
    if (action === "test-message") {
      if (!testPhone) {
        return json({ 
          success: false, 
          error: "Phone number is required for testing" 
        });
      }

      // Get shop settings
      const settings = await db.emailAutomationSettings.findUnique({
        where: { shop }
      });

      if (!settings?.whatsappProvider || !settings?.whatsappApiKey) {
        return json({ 
          success: false, 
          error: "WhatsApp provider not configured. Please configure in automation settings first." 
        });
      }

      console.log(`📱 Sending test WhatsApp to: ${testPhone}`);
      
      // Initialize WhatsApp service
      whatsappService.initialize(settings.whatsappProvider, settings.whatsappApiKey);

      // Format phone number
      const formattedPhone = whatsappService.formatPhoneNumber(testPhone);
      if (!formattedPhone) {
        return json({ 
          success: false, 
          error: "Invalid phone number format. Please include country code (e.g., +1234567890)" 
        });
      }

      // Send test message
      const messageData = {
        phone: formattedPhone,
        customerName: "Test Customer",
        orderNumber: "TEST" + Date.now(),
        reviewLink: `${process.env.APP_URL || 'http://localhost:3000'}/submit-review/test?test=true`,
        message: whatsappService.generateReviewMessage({
          customerName: "Test Customer",
          orderNumber: "TEST" + Date.now(),
          reviewLink: `${process.env.APP_URL || 'http://localhost:3000'}/submit-review/test?test=true`
        })
      };

      const result = await whatsappService.sendMessage(messageData);

      if (result.success) {
        console.log("✅ Test WhatsApp sent successfully!");
        return json({
          success: true,
          message: `Test WhatsApp message sent successfully to ${formattedPhone}!`,
          messageId: result.messageId,
          provider: result.provider
        });
      } else {
        console.error("❌ Test WhatsApp failed:", result.error);
        return json({
          success: false,
          error: result.error
        });
      }
    }

    // Send WhatsApp for specific review request
    if (reviewRequestId) {
      console.log(`📱 Sending WhatsApp for review request: ${reviewRequestId}`);

      // Get the review request
      const reviewRequest = await db.reviewRequest.findUnique({
        where: { id: parseInt(reviewRequestId) }
      });

      if (!reviewRequest) {
        return json({ 
          success: false, 
          error: "Review request not found" 
        });
      }

      if (reviewRequest.shop !== shop) {
        return json({ 
          success: false, 
          error: "Unauthorized access to review request" 
        });
      }

      if (!reviewRequest.customerPhone) {
        return json({ 
          success: false, 
          error: "No phone number available for this customer" 
        });
      }

      // Get automation settings
      const settings = await db.emailAutomationSettings.findUnique({
        where: { shop }
      });

      if (!settings?.whatsappProvider || !settings?.whatsappApiKey) {
        return json({ 
          success: false, 
          error: "WhatsApp provider not configured" 
        });
      }

      // Send WhatsApp message
      const result = await whatsappService.sendReviewRequest(reviewRequest, {
        ...settings,
        whatsappApiKey: settings.whatsappApiKey
      });

      if (result.success) {
        console.log("✅ WhatsApp review request sent!");
        return json({
          success: true,
          message: "WhatsApp message sent successfully!",
          messageId: result.messageId
        });
      } else {
        console.error("❌ WhatsApp send failed:", result.error);
        return json({
          success: false,
          error: result.error
        });
      }
    }

    // Process pending WhatsApp messages
    if (action === "process-pending") {
      console.log("🔄 Processing pending WhatsApp messages...");

      // Get automation settings
      const settings = await db.emailAutomationSettings.findUnique({
        where: { shop }
      });

      if (!settings?.whatsappProvider || !settings?.whatsappApiKey) {
        return json({ 
          success: false, 
          error: "WhatsApp provider not configured" 
        });
      }

      // Get pending review requests with phone numbers that are ready to send
      const now = new Date();
      const pendingRequests = await db.reviewRequest.findMany({
        where: {
          shop,
          status: 'pending',
          customerPhone: { not: null },
          whatsappSent: false,
          scheduledSendDate: { lte: now }
        },
        orderBy: { scheduledSendDate: 'asc' },
        take: 10 // Process max 10 at a time
      });

      console.log(`📋 Found ${pendingRequests.length} pending WhatsApp requests`);

      const results = [];
      for (const request of pendingRequests) {
        const result = await whatsappService.sendReviewRequest(request, {
          ...settings,
          whatsappApiKey: settings.whatsappApiKey
        });
        results.push({ id: request.id, success: result.success, error: result.error });
        
        // Add small delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      return json({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failedCount,
        message: `Processed ${results.length} WhatsApp messages: ${successCount} sent, ${failedCount} failed`
      });
    }

    return json({ 
      success: false, 
      error: "Invalid action or missing parameters" 
    });

  } catch (error) {
    console.error("❌ WhatsApp API error:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function loader({ request }) {
  // Handle GET requests for connection testing
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'test-connection') {
    return json({ 
      success: false, 
      error: "Use POST method for testing connections" 
    });
  }

  return json({ 
    success: false, 
    error: "Use POST method for WhatsApp API calls" 
  });
} 