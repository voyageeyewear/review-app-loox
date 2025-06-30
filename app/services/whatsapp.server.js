import { prisma as db } from "../utils/db.server";

export class WhatsAppService {
  constructor() {
    this.apiKey = null;
    this.provider = null;
  }

  /**
   * Initialize WhatsApp service with provider credentials
   * @param {string} provider - WhatsApp provider (wati, whatsapp-api, gallabox)
   * @param {string} apiKey - Provider API key
   */
  initialize(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    console.log(`📱 WhatsApp service initialized with provider: ${provider}`);
  }

  /**
   * Send WhatsApp message using the configured provider
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(messageData) {
    try {
      console.log(`📱 Sending WhatsApp message via ${this.provider}...`);
      console.log(`📞 To: ${messageData.phone}`);
      console.log(`👤 Customer: ${messageData.customerName}`);

      switch (this.provider) {
        case 'wati':
          return await this.sendViaWati(messageData);
        case 'whatsapp-api':
          return await this.sendViaWhatsAppAPI(messageData);
        case 'gallabox':
          return await this.sendViaGallabox(messageData);
        case 'interakt':
          return await this.sendViaInterakt(messageData);
        default:
          throw new Error(`Unsupported WhatsApp provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('❌ WhatsApp send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send via Wati WhatsApp API
   */
  async sendViaWati(messageData) {
    try {
      const url = 'https://live-server.wati.io/api/v1/sendTemplateMessage';
      
      const payload = {
        whatsappNumber: messageData.phone,
        templateName: 'review_request', // Template must be approved in wati dashboard
        bodyVariables: [
          messageData.customerName,
          messageData.orderNumber,
          messageData.reviewLink
        ]
      };

      console.log(`🌐 Making POST request to: ${url}`);
      console.log(`🔑 Using API key: ${this.apiKey.substring(0, 10)}...`);
      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      console.log(`📊 Response status: ${response.status}`);
      
      const responseData = await response.json();
      console.log(`📄 Response data:`, responseData);

      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully via Wati!');
        return {
          success: true,
          provider: 'wati',
          messageId: responseData.id,
          data: responseData
        };
      } else {
        throw new Error(`Wati API error: ${responseData.message || response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Wati send error:', error);
      throw error;
    }
  }

  /**
   * Send via WhatsApp Business API
   */
  async sendViaWhatsAppAPI(messageData) {
    try {
      const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        to: messageData.phone,
        type: "template",
        template: {
          name: "review_request", // Template must be approved
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: messageData.customerName
                },
                {
                  type: "text", 
                  text: messageData.orderNumber
                }
              ]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: messageData.reviewLink
                }
              ]
            }
          ]
        }
      };

      console.log(`🌐 Making POST request to: ${url}`);
      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      console.log(`📊 Response status: ${response.status}`);
      
      const responseData = await response.json();
      console.log(`📄 Response data:`, responseData);

      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully via WhatsApp API!');
        return {
          success: true,
          provider: 'whatsapp-api',
          messageId: responseData.messages[0].id,
          data: responseData
        };
      } else {
        throw new Error(`WhatsApp API error: ${responseData.error?.message || response.statusText}`);
      }

    } catch (error) {
      console.error('❌ WhatsApp API send error:', error);
      throw error;
    }
  }

  /**
   * Send via Gallabox WhatsApp API
   */
  async sendViaGallabox(messageData) {
    try {
      const url = 'https://server.gallabox.com/devapi/messages/whatsapp';
      
      const payload = {
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: messageData.customerName,
          phone: messageData.phone
        },
        whatsapp: {
          type: "template",
          template: {
            templateId: "review_request", // Template ID from Gallabox
            bodyVariables: [
              messageData.customerName,
              messageData.orderNumber,
              messageData.reviewLink
            ]
          }
        }
      };

      console.log(`🌐 Making POST request to: ${url}`);
      console.log(`🔑 Using API key: ${this.apiKey.substring(0, 10)}...`);
      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log(`📊 Response status: ${response.status}`);
      
      const responseData = await response.json();
      console.log(`📄 Response data:`, responseData);

      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully via Gallabox!');
        return {
          success: true,
          provider: 'gallabox',
          messageId: responseData.messageId,
          data: responseData
        };
      } else {
        throw new Error(`Gallabox API error: ${responseData.message || response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Gallabox send error:', error);
      throw error;
    }
  }

  /**
   * Send via Interakt WhatsApp API
   */
  async sendViaInterakt(messageData) {
    try {
      const url = 'https://api.interakt.ai/v1/public/message/';
      
      const payload = {
        countryCode: messageData.phone.substring(1, 3), // Extract country code
        phoneNumber: messageData.phone.substring(3), // Phone without country code
        type: "Template",
        template: {
          name: "review_request", // Template must be approved in Interakt dashboard
          languageCode: "en",
          bodyValues: [
            messageData.customerName,
            messageData.orderNumber,
            messageData.reviewLink
          ]
        }
      };

      console.log(`🌐 Making POST request to: ${url}`);
      console.log(`🔑 Using API key: ${this.apiKey.substring(0, 10)}...`);
      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      console.log(`📊 Response status: ${response.status}`);
      
      const responseData = await response.json();
      console.log(`📄 Response data:`, responseData);

      if (response.ok && responseData.result) {
        console.log('✅ WhatsApp message sent successfully via Interakt!');
        return {
          success: true,
          provider: 'interakt',
          messageId: responseData.messageId,
          data: responseData
        };
      } else {
        throw new Error(`Interakt API error: ${responseData.message || response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Interakt send error:', error);
      throw error;
    }
  }

  /**
   * Test WhatsApp provider connection
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<Object>} Test result
   */
  async testConnection(provider, apiKey) {
    try {
      console.log(`🧪 Testing ${provider} connection...`);
      
      // Create a temporary instance for testing
      const testService = new WhatsAppService();
      testService.initialize(provider, apiKey);

      // Test with a simple message (won't actually send)
      const testData = {
        phone: '+1234567890',
        customerName: 'Test Customer',
        orderNumber: 'TEST123',
        reviewLink: 'https://example.com/review/test'
      };

      // For testing, we'll just validate the API key format and endpoint
      switch (provider) {
        case 'wati':
          return await this.testWatiConnection(apiKey);
        case 'whatsapp-api':
          return await this.testWhatsAppAPIConnection(apiKey);
        case 'gallabox':
          return await this.testGallaboxConnection(apiKey);
        case 'interakt':
          return await this.testInteraktConnection(apiKey);
        default:
          return {
            success: false,
            error: `Provider ${provider} not supported`
          };
      }

    } catch (error) {
      console.error(`❌ ${provider} connection test failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWatiConnection(apiKey) {
    try {
      const response = await fetch('https://live-server.wati.io/api/v1/getTemplates', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Wati connection successful!',
          provider: 'wati'
        };
      } else {
        return {
          success: false,
          error: 'Invalid Wati API key'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to Wati: ' + error.message
      };
    }
  }

  async testWhatsAppAPIConnection(apiKey) {
    try {
      // Test by checking if we can access the phone number info
      const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'WhatsApp Business API connection successful!',
          provider: 'whatsapp-api'
        };
      } else {
        return {
          success: false,
          error: 'Invalid WhatsApp Business API token'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to WhatsApp API: ' + error.message
      };
    }
  }

  async testGallaboxConnection(apiKey) {
    try {
      const response = await fetch('https://server.gallabox.com/devapi/channels', {
        headers: {
          'apikey': apiKey
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Gallabox connection successful!',
          provider: 'gallabox'
        };
      } else {
        return {
          success: false,
          error: 'Invalid Gallabox API key'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to Gallabox: ' + error.message
      };
    }
  }

  async testInteraktConnection(apiKey) {
    try {
      const response = await fetch('https://api.interakt.ai/v1/public/track/users/', {
        headers: {
          'Authorization': `Basic ${apiKey}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Interakt connection successful!',
          provider: 'interakt'
        };
      } else {
        return {
          success: false,
          error: 'Invalid Interakt API key'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to connect to Interakt: ' + error.message
      };
    }
  }

  /**
   * Format phone number for WhatsApp (ensure it starts with country code)
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If doesn't start with country code, assume US (+1)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Generate review request message template
   * @param {Object} data - Message data
   * @returns {string} Message text
   */
  generateReviewMessage(data) {
    return `Hi ${data.customerName}! 👋

Thank you for your recent order #${data.orderNumber}! 

We'd love to hear about your experience. Your feedback helps us improve and helps other customers make informed decisions.

⭐ Please take 2 minutes to share your review:
${data.reviewLink}

Thank you for choosing us! 🙏

Best regards,
Customer Experience Team`;
  }

  /**
   * Send review request WhatsApp message
   * @param {Object} reviewRequest - Review request from database
   * @param {Object} settings - Automation settings
   * @returns {Promise<Object>} Send result
   */
  async sendReviewRequest(reviewRequest, settings) {
    try {
      console.log(`📱 Sending WhatsApp review request for order: ${reviewRequest.orderNumber}`);
      
      if (!settings.whatsappProvider) {
        throw new Error('WhatsApp provider not configured');
      }

      if (!reviewRequest.customerPhone) {
        throw new Error('Customer phone number not available');
      }

      // Initialize with provider settings
      this.initialize(settings.whatsappProvider, settings.whatsappApiKey);

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(reviewRequest.customerPhone);
      if (!formattedPhone) {
        throw new Error('Invalid phone number format');
      }

      // Generate review link
      const reviewLink = `${process.env.APP_URL || 'http://localhost:3000'}/submit-review/${JSON.parse(reviewRequest.productIds)[0]}?order=${reviewRequest.orderNumber}&customer=${encodeURIComponent(reviewRequest.customerName)}`;

      // Prepare message data
      const messageData = {
        phone: formattedPhone,
        customerName: reviewRequest.customerName,
        orderNumber: reviewRequest.orderNumber,
        reviewLink: reviewLink,
        message: this.generateReviewMessage({
          customerName: reviewRequest.customerName,
          orderNumber: reviewRequest.orderNumber,
          reviewLink: reviewLink
        })
      };

      // Send WhatsApp message
      const result = await this.sendMessage(messageData);

      if (result.success) {
        // Update review request status
        await db.reviewRequest.update({
          where: { id: reviewRequest.id },
          data: {
            whatsappSent: true,
            status: reviewRequest.emailSent ? 'sent' : 'partially-sent',
            sentAt: new Date()
          }
        });

        console.log(`✅ WhatsApp review request sent successfully!`);
        console.log(`📱 Phone: ${formattedPhone}`);
        console.log(`👤 Customer: ${reviewRequest.customerName}`);
        console.log(`📦 Order: ${reviewRequest.orderNumber}`);
      }

      return result;

    } catch (error) {
      console.error('❌ WhatsApp review request failed:', error);
      
      // Update review request with error
      await db.reviewRequest.update({
        where: { id: reviewRequest.id },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService(); 