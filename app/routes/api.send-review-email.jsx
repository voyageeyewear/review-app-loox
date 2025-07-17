import { json } from "@remix-run/node";
import { EmailService } from "../services/email.server.js";
import { prisma as db } from "../utils/db.server.js";

export async function action({ request }) {
  try {
    const data = await request.json();
    console.log("🧪 Testing Klaviyo email sending...");

    // Extract parameters
    const { 
      reviewRequestId, 
      testEmail = null,
      apiKey = process.env.KLAVIYO_API_KEY || "" // Klaviyo private API key from environment
    } = data;

    if (testEmail) {
      // Send test email directly without database interaction
      console.log(`📧 Sending test email to: ${testEmail}`);
      
      const emailService = new EmailService();
      
      // Create test email data (no database interaction)
      const testEmailData = {
        to: testEmail,
        subject: 'How was your recent purchase? (Test)',
        customerName: 'Atul Saini',
        orderNumber: '2025',
        reviewLink: 'http://localhost:56052/submit-review/9038857732326',
        productNames: ['iPhone 15 Pro - Deep Purple', 'iPhone 15 Pro Case', 'MagSafe Charger'],
        storeUrl: 'https://tryongoeye.myshopify.com'
      };

      // Test settings for Klaviyo
      const testSettings = {
        enabled: true,
        emailProvider: 'klaviyo',
        whatsappProvider: null,
        emailSubject: 'How was your recent purchase? (Test)',
        apiKey: apiKey // Use the REAL API key, not placeholder
      };

      // Send email directly without database update
      const result = await emailService.sendUsingProvider(
        'klaviyo',
        apiKey, // Use the REAL API key directly
        'email',
        testEmailData
      );
      
      return json({
        success: true,
        message: 'Test email sent successfully!',
        result: result,
        testEmail: testEmail
      });

    } else if (reviewRequestId) {
      // Send actual review request
      console.log(`📋 Sending review request ID: ${reviewRequestId}`);

      // Get review request from database
      const reviewRequest = await db.reviewRequest.findUnique({
        where: { id: parseInt(reviewRequestId) }
      });

      if (!reviewRequest) {
        return json({ 
          success: false, 
          error: 'Review request not found' 
        }, { status: 404 });
      }

      // Get automation settings
      const settings = await db.emailAutomationSettings.findUnique({
        where: { shop: reviewRequest.shop }
      });

      if (!settings) {
        return json({ 
          success: false, 
          error: 'Email automation settings not found' 
        }, { status: 404 });
      }

      // Add API key to settings if not present
      if (!settings.apiKey) {
        settings.apiKey = apiKey;
      }

      const emailService = new EmailService();
      const result = await emailService.sendReviewRequest(reviewRequest, settings);

      return json({
        success: result.success,
        message: result.success ? 'Review request sent successfully!' : 'Failed to send review request',
        result: result,
        reviewRequestId: reviewRequestId
      });

    } else {
      return json({ 
        success: false, 
        error: 'Either testEmail or reviewRequestId is required' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ API send email error:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function loader({ request }) {
  // GET request to test KwikEngage connection
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'test-connection') {
      console.log("🔌 Testing Klaviyo connection...");
      
      const emailService = new EmailService();
      const result = await emailService.testProvider(
        'klaviyo', 
        process.env.KLAVIYO_API_KEY || "" // Klaviyo private API key from environment
      );

      return json({
        success: result.success,
        message: result.message,
        provider: 'Klaviyo',
        endpoint: 'https://a.klaviyo.com/api'
      });
    }

    // Default: return pending review requests
    const pendingRequests = await db.reviewRequest.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return json({
      success: true,
      pendingRequests: pendingRequests,
      count: pendingRequests.length
    });

  } catch (error) {
    console.error("❌ API loader error:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 