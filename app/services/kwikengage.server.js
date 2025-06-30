// KwikEngage API integration
// Handles email and WhatsApp sending through KwikEngage

export class KwikEngageService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.kwikengage.ai';
    this.sendMessageEndpoint = '/send-message/v2';
  }

  /**
   * Send email through KwikEngage
   * @param {Object} emailData - Email configuration
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Email content (HTML)
   * @param {string} emailData.customerName - Customer name
   * @param {string} emailData.reviewLink - Review link URL
   * @returns {Promise<Object>} Response from KwikEngage
   */
  async sendEmail(emailData) {
    try {
      const { to, subject, message, customerName, reviewLink } = emailData;

      // KwikEngage email payload
      const payload = {
        channel: "email",
        recipient: to,
        message: {
          subject: subject,
          body: message,
          // Add customer data for personalization
          variables: {
            customer_name: customerName,
            review_link: reviewLink,
            store_name: "Your Store" // Can be configured
          }
        },
        // Optional: Add metadata for tracking
        metadata: {
          type: "review_request",
          source: "shopify_automation"
        }
      };

      console.log(`📧 Sending email via KwikEngage to: ${to}`);
      console.log(`📋 Subject: ${subject}`);

      const response = await this.makeRequest(payload);
      
      if (response.success) {
        console.log(`✅ Email sent successfully via KwikEngage`);
        return {
          success: true,
          messageId: response.messageId || response.id,
          provider: 'kwikengage',
          channel: 'email'
        };
      } else {
        throw new Error(`KwikEngage API error: ${response.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`❌ KwikEngage email failed:`, error.message);
      return {
        success: false,
        error: error.message,
        provider: 'kwikengage',
        channel: 'email'
      };
    }
  }

  /**
   * Send WhatsApp message through KwikEngage
   * @param {Object} whatsappData - WhatsApp configuration
   * @param {string} whatsappData.to - Recipient phone number
   * @param {string} whatsappData.message - WhatsApp message content
   * @param {string} whatsappData.customerName - Customer name
   * @param {string} whatsappData.reviewLink - Review link URL
   * @returns {Promise<Object>} Response from KwikEngage
   */
  async sendWhatsApp(whatsappData) {
    try {
      const { to, message, customerName, reviewLink } = whatsappData;

      // Clean phone number (remove any non-digits except +)
      const cleanPhone = to.replace(/[^\d+]/g, '');

      const payload = {
        channel: "whatsapp",
        recipient: cleanPhone,
        message: {
          type: "text",
          text: message
        },
        variables: {
          customer_name: customerName,
          review_link: reviewLink
        },
        metadata: {
          type: "review_request_whatsapp",
          source: "shopify_automation"
        }
      };

      console.log(`📱 Sending WhatsApp via KwikEngage to: ${cleanPhone}`);

      const response = await this.makeRequest(payload);
      
      if (response.success) {
        console.log(`✅ WhatsApp sent successfully via KwikEngage`);
        return {
          success: true,
          messageId: response.messageId || response.id,
          provider: 'kwikengage',
          channel: 'whatsapp'
        };
      } else {
        throw new Error(`KwikEngage WhatsApp error: ${response.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`❌ KwikEngage WhatsApp failed:`, error.message);
      return {
        success: false,
        error: error.message,
        provider: 'kwikengage',
        channel: 'whatsapp'
      };
    }
  }

  /**
   * Make HTTP request to KwikEngage API
   * @param {Object} payload - Request payload
   * @returns {Promise<Object>} API response
   */
  async makeRequest(payload) {
    const url = `${this.baseUrl}${this.sendMessageEndpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Test the KwikEngage connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      // Send a test message to validate API key
      const testPayload = {
        channel: "email",
        recipient: "test@example.com",
        message: {
          subject: "KwikEngage Test",
          body: "API connection test"
        },
        test: true // Add test flag if supported
      };

      const response = await this.makeRequest(testPayload);
      
      return {
        success: true,
        message: "KwikEngage connection successful",
        response: response
      };

    } catch (error) {
      return {
        success: false,
        message: "KwikEngage connection failed",
        error: error.message
      };
    }
  }
}

/**
 * Create review request email content
 * @param {Object} data - Email data
 * @returns {string} HTML email content
 */
export function createReviewEmailTemplate(data) {
  const { customerName, orderNumber, reviewLink, productNames = [], storeUrl = "#" } = data;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How was your recent purchase?</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #4CAF50; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #45a049; }
        .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .stars { color: #ffd700; font-size: 24px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 How was your recent purchase?</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${customerName}!</h2>
            
            <p>We hope you're loving your recent purchase from order <strong>#${orderNumber}</strong>!</p>
            
            ${productNames.length > 0 ? `
                <p><strong>Products you purchased:</strong></p>
                <ul>
                    ${productNames.map(name => `<li>${name}</li>`).join('')}
                </ul>
            ` : ''}
            
            <p>Your feedback means the world to us! Could you take 2 minutes to share your experience?</p>
            
            <div class="stars">⭐⭐⭐⭐⭐</div>
            
            <div style="text-align: center;">
                <a href="${reviewLink}" class="button">✍️ Write a Review</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                Your honest review helps other customers make informed decisions and helps us improve our products and service.
            </p>
            
            <p>Thank you for choosing us!</p>
            <p>Best regards,<br>Your Store Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent because you recently made a purchase. If you no longer wish to receive these emails, you can unsubscribe.</p>
            <p><a href="${storeUrl}">Visit our store</a></p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Create WhatsApp review request message
 * @param {Object} data - Message data
 * @returns {string} WhatsApp message content
 */
export function createWhatsAppTemplate(data) {
  const { customerName, orderNumber, reviewLink } = data;

  return `🌟 Hi ${customerName}!

We hope you're loving your recent purchase from order #${orderNumber}!

Your feedback means the world to us! Could you take 2 minutes to share your experience?

✍️ Write a review: ${reviewLink}

Thank you for choosing us! 🙏

Best regards,
Your Store Team`;
} 