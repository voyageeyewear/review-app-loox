// Klaviyo API integration
// Handles email sending through Klaviyo's reliable transactional email API

export class KlaviyoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://a.klaviyo.com/api';
    this.legacyUrl = 'https://a.klaviyo.com/api/v1-v2'; // Legacy API
    this.version = '2024-06-15'; // Latest API version
    
    console.log(`🔑 KlaviyoService initialized with API key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NULL'}`);
  }

  /**
   * Send email through Klaviyo (try direct email first, fallback to events)
   * @param {Object} emailData - Email configuration
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Email content (HTML)
   * @param {string} emailData.customerName - Customer name
   * @param {string} emailData.reviewLink - Review link URL
   * @param {string} emailData.orderNumber - Order number
   * @returns {Promise<Object>} Response from Klaviyo
   */
  async sendEmail(emailData) {
    try {
      const { to, subject, message, customerName, reviewLink, orderNumber } = emailData;

      console.log(`📧 Sending email via Klaviyo to: ${to}`);
      console.log(`📋 Subject: ${subject}`);
      console.log(`👤 Customer: ${customerName}`);

      // Validate required fields
      if (!to) {
        throw new Error("Email address (to) is required");
      }

      // METHOD 1: Try direct transactional email first
      console.log(`🚀 Attempting direct transactional email send...`);
      try {
        const emailContent = message || createKlaviyoEmailTemplate({
          customerName: customerName || "Valued Customer",
          orderNumber: orderNumber || "",
          reviewLink: reviewLink || "#",
          productNames: [],
          storeUrl: "#"
        });

        const transactionalResult = await this.sendTransactionalEmail({
          to: to,
          subject: subject || "How was your recent purchase?",
          html: emailContent,
          customerName: customerName || "Valued Customer"
        });

        if (transactionalResult.success) {
          console.log(`✅ Direct transactional email sent successfully!`);
          return {
            success: true,
            messageId: transactionalResult.messageId,
            provider: 'klaviyo',
            channel: 'email',
            method: 'transactional_email',
            note: 'Email sent directly via Klaviyo transactional API'
          };
        } else {
          console.log(`⚠️ Direct email failed: ${transactionalResult.error}`);
        }
      } catch (directEmailError) {
        console.log(`⚠️ Direct email error: ${directEmailError.message}`);
      }

      // METHOD 2: Fallback to event tracking (requires Klaviyo flows)
      console.log(`🔄 Falling back to event tracking method...`);
      const eventResponse = await this.trackSimpleEvent({
        email: to, // Map 'to' to 'email' for the event
        customerName: customerName || "Valued Customer",
        orderNumber: orderNumber || "",
        subject: subject || "Review Request",
        reviewLink: reviewLink || "#"
      });
      
      if (eventResponse.success) {
        console.log(`✅ Event tracked successfully in Klaviyo`);
        console.log(`📧 Profile created/updated for: ${to}`);
        
        return {
          success: true,
          messageId: eventResponse.eventId || 'klaviyo_event_tracked',
          provider: 'klaviyo',
          channel: 'email',
          method: 'event_tracking',
          note: 'Event tracked in Klaviyo - email will be sent via flow (if configured)'
        };
      } else {
        throw new Error(eventResponse.error);
      }

    } catch (error) {
      console.error(`❌ Klaviyo email failed:`, error.message);
      return {
        success: false,
        error: error.message,
        provider: 'klaviyo',
        channel: 'email'
      };
    }
  }

  /**
   * Send transactional email via Klaviyo
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendTransactionalEmail(emailData) {
    try {
      const { to, subject, html, customerName } = emailData;

      console.log(`📧 Sending transactional email to: ${to}`);
      console.log(`📋 Subject: ${subject}`);

      const payload = {
        data: {
          type: "email",
          attributes: {
            send_options: {
              use_smart_sending: false,
              ignore_preferences: false
            },
            send_strategy: {
              method: "immediate"
            },
            recipient: {
              email: to,
              name: customerName || "Valued Customer"
            },
            from_email: "noreply@tryongoeye.myshopify.com", // Use shop domain
            from_name: "Tryong Eyewear Reviews",
            subject: subject,
            content: {
              html: html,
              text: this.stripHtml(html) // Generate text version
            }
          }
        }
      };

      console.log(`🌐 Sending transactional email via Klaviyo API...`);
      const response = await this.makeRequest('/emails/', payload, 'POST');
      
      console.log(`✅ Transactional email sent successfully!`);
      return {
        success: true,
        messageId: response.data?.id || 'klaviyo_email_sent',
        provider: 'klaviyo'
      };

    } catch (error) {
      console.error(`❌ Transactional email failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'klaviyo'
      };
    }
  }

  /**
   * Track simple event in Klaviyo (simplified reliable version)
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Response
   */
  async trackSimpleEvent(eventData) {
    try {
      const { email, customerName, orderNumber, subject, reviewLink } = eventData;
      
      console.log(`🎯 Tracking "Review Request Sent" event for: ${email}`);
      console.log(`📋 Event data received:`, JSON.stringify(eventData, null, 2));
      
      // Validate required fields
      if (!email) {
        throw new Error("Email address is required for event tracking");
      }
      
      // Simplified event structure that Klaviyo accepts reliably
      const eventPayload = {
        data: {
          type: "event",
          attributes: {
            properties: {
              order_number: orderNumber || "",
              customer_name: customerName || "Customer",
              review_link: reviewLink || "#",
              email_subject: subject || "Review Request"
            },
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Review Request Sent"
                }
              }
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email
                }
              }
            },
            time: new Date().toISOString()
          }
        }
      };

      console.log(`📊 Sending simplified event to Klaviyo for email: ${email}`);
      const response = await this.makeRequest('/events/', eventPayload, 'POST');
      
      console.log(`✅ "Review Request Sent" event sent successfully!`);
      
      return {
        success: true,
        eventId: response.data?.id || 'event_sent',
        provider: 'klaviyo',
        note: `"Review Request Sent" metric should now be available in Klaviyo`
      };

    } catch (error) {
      console.error(`❌ Event tracking failed for email: ${eventData?.email || 'UNDEFINED'}`);
      console.error(`❌ Error details:`, error.message);
      
      // Fallback: just create/update profile with properties
      try {
        const { email, customerName, orderNumber, subject, reviewLink } = eventData;
        
        if (!email) {
          throw new Error("Email address is required for profile creation fallback");
        }
        
        console.log(`🔄 Fallback: Creating profile with review data for: ${email}`);
        
        const profilePayload = {
          data: {
            type: "profile",
            attributes: {
              email: email,
              first_name: customerName ? customerName.split(' ')[0] : null,
              properties: {
                last_order_number: orderNumber || "",
                last_review_link: reviewLink || "#",
                last_email_subject: subject || "Review Request",
                source: "review_request_app"
              }
            }
          }
        };

        const response = await this.makeRequest('/profiles/', profilePayload, 'POST');
        
        return {
          success: true,
          eventId: response.data?.id || 'profile_updated',
          provider: 'klaviyo',
          note: `Profile updated for ${email} - check Klaviyo manually for "Review Request Sent" metric`
        };

      } catch (fallbackError) {
        console.error(`❌ Fallback profile creation also failed:`, fallbackError.message);
        return {
          success: false,
          error: `Both event and profile creation failed: ${error.message} | ${fallbackError.message}`,
          provider: 'klaviyo'
        };
      }
    }
  }

  /**
   * Create/update profile in Klaviyo
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Response
   */
  async createProfile(profileData) {
    try {
      const { email, firstName, lastName } = profileData;
      
      const payload = {
        data: {
          type: "profile",
          attributes: {
            email: email,
            first_name: firstName,
            last_name: lastName,
            properties: {
              source: "review_app"
            }
          }
        }
      };

      const response = await this.makeRequest('/profiles/', payload, 'POST');
      
      return {
        success: true,
        profileId: response.data?.id,
        provider: 'klaviyo'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'klaviyo'
      };
    }
  }

  /**
   * Track review request event in Klaviyo
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Response
   */
  async trackReviewRequestEvent(eventData) {
    try {
      const { email, customerName, orderNumber, subject, reviewLink, emailContent } = eventData;
      
      const payload = {
        data: {
          type: "event",
          attributes: {
            properties: {
              customer_name: customerName,
              order_number: orderNumber,
              email_subject: subject,
              review_link: reviewLink,
              email_content: emailContent,
              event_source: "review_app_automation"
            },
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Review Request Sent"
                }
              }
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: email
                }
              }
            },
            time: new Date().toISOString(),
            value: 1
          }
        }
      };

      const response = await this.makeRequest('/events/', payload, 'POST');
      
      return {
        success: true,
        eventId: response.data?.id,
        provider: 'klaviyo'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'klaviyo'
      };
    }
  }

  /**
   * Create/track event in Klaviyo (legacy method)
   * @param {Object} payload - Event payload
   * @returns {Promise<Object>} Response
   */
  async createEvent(payload) {
    try {
      const response = await this.makeRequest('/events/', payload, 'POST');
      
      return {
        success: true,
        eventId: response.data?.id,
        provider: 'klaviyo'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'klaviyo'
      };
    }
  }

  /**
   * Send WhatsApp message (not supported by Klaviyo, but keeping interface)
   * @param {Object} whatsappData - WhatsApp configuration
   * @returns {Promise<Object>} Response (always fails for Klaviyo)
   */
  async sendWhatsApp(whatsappData) {
    return {
      success: false,
      error: "WhatsApp not supported by Klaviyo. Please use a different provider for SMS/WhatsApp.",
      provider: 'klaviyo',
      channel: 'whatsapp'
    };
  }

  /**
   * Make HTTP request to Klaviyo API
   * @param {string} endpoint - API endpoint
   * @param {Object} payload - Request payload
   * @param {string} method - HTTP method
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, payload, method = 'POST') {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Revision': this.version
    };
    
    console.log(`🌐 Making ${method} request to: ${url}`);
    console.log(`🔑 Using API key: ${this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NULL'}`);
    console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

    // Get response text first
    const responseText = await response.text();
    console.log(`📄 Raw response text:`, responseText);

    if (!response.ok) {
      console.log(`❌ HTTP error ${response.status}: ${responseText}`);
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    // Try to parse JSON, handle empty responses
    if (!responseText.trim()) {
      console.log(`⚠️ Empty response body, returning default success`);
      return { data: { id: 'empty_response_success' } };
    }

    try {
      const result = JSON.parse(responseText);
      console.log(`✅ Parsed JSON response:`, JSON.stringify(result, null, 2));
      return result;
    } catch (parseError) {
      console.error(`❌ JSON parsing failed:`, parseError.message);
      console.error(`❌ Response text was:`, responseText);
      throw new Error(`JSON parsing failed: ${parseError.message}. Response: ${responseText}`);
    }
  }

  /**
   * Test the Klaviyo connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      // Test by getting account info
      const response = await fetch(`${this.baseUrl}/accounts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'Accept': 'application/json',
          'Revision': this.version
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "Klaviyo connection successful",
          account: data.data?.[0]?.attributes?.test_account ? "Test Account" : "Live Account"
        };
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

    } catch (error) {
      return {
        success: false,
        message: "Klaviyo connection failed",
        error: error.message
      };
    }
  }

  /**
   * Strip HTML tags to create text version
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}

/**
 * Create review request email content (improved for Klaviyo)
 * @param {Object} data - Email data
 * @returns {string} HTML email content
 */
export function createKlaviyoEmailTemplate(data) {
  const { customerName, orderNumber, reviewLink, productNames = [], storeUrl = "#" } = data;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How was your recent purchase?</title>
    <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc; 
          line-height: 1.6;
          color: #334155;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff; 
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px; 
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }
        .order-info {
          background-color: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .products-list {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .product-item {
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .product-item:last-child {
          border-bottom: none;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
          transition: all 0.2s;
        }
        .button:hover { 
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 8px rgba(16, 185, 129, 0.3);
        }
        .stars { 
          color: #fbbf24; 
          font-size: 32px; 
          margin: 20px 0; 
          text-align: center;
        }
        .footer { 
          background-color: #f8fafc; 
          padding: 30px; 
          text-align: center; 
          color: #64748b; 
          font-size: 14px; 
          border-top: 1px solid #e2e8f0;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .testimonial {
          font-style: italic;
          color: #64748b;
          background-color: #f8fafc;
          padding: 15px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .content, .header, .footer {
            padding: 20px;
          }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 How was your recent purchase?</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">We'd love to hear from you!</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${customerName}! 👋</div>
            
            <p>We hope you're absolutely loving your recent purchase! Your satisfaction means everything to us.</p>
            
            <div class="order-info">
                <strong>📦 Order #${orderNumber}</strong>
                <br>
                <span style="color: #64748b;">Thank you for choosing us!</span>
            </div>
            
            ${productNames.length > 0 ? `
                <div class="products-list">
                    <strong style="color: #1e293b;">🛍️ What you purchased:</strong>
                    ${productNames.map(name => `
                        <div class="product-item">
                            <span style="color: #475569;">• ${name}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="testimonial">
                "Your honest review helps other customers make informed decisions and helps us improve our products and service."
            </div>
            
            <div class="stars">⭐⭐⭐⭐⭐</div>
            
            <div style="text-align: center;">
                <a href="${reviewLink}" class="button">✍️ Write Your Review</a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
                Takes less than 2 minutes • Your feedback is invaluable to us
            </p>
            
            <p style="margin-top: 30px;">
                Thank you for being an amazing customer! 🙏
            </p>
            <p style="margin-bottom: 0;">
                <strong>The Team at Your Store</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>📧 This email was sent because you recently made a purchase.</p>
            <p>
                <a href="${storeUrl}">Visit our store</a> | 
                <a href="#">Unsubscribe</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                Powered by Klaviyo Email Automation
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
} 