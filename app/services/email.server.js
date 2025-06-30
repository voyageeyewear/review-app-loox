// Email service for sending review requests
// Supports multiple providers: Klaviyo, KwikEngage, etc.

import { KwikEngageService, createReviewEmailTemplate, createWhatsAppTemplate } from './kwikengage.server.js';
import { KlaviyoService, createKlaviyoEmailTemplate } from './klaviyo.server.js';
import { prisma as db } from '../utils/db.server.js';

export class EmailService {
  constructor() {
    this.providers = {
      'klaviyo': KlaviyoService,
      'kwikengage': KwikEngageService,
      'kwik-engage': KwikEngageService, // Alternative spelling
    };
  }

  /**
   * Send review request email
   * @param {Object} reviewRequest - Review request from database
   * @param {Object} settings - Email automation settings
   * @returns {Promise<Object>} Send result
   */
  async sendReviewRequest(reviewRequest, settings) {
    try {
      console.log(`📧 Processing review request ID: ${reviewRequest.id}`);
      console.log(`👤 Customer: ${reviewRequest.customerName} (${reviewRequest.customerEmail})`);
      console.log(`📋 Order: ${reviewRequest.orderNumber}`);

      // Create review link
      const reviewLink = this.createReviewLink(reviewRequest);
      
      // Get product names from IDs
      const productNames = await this.getProductNames(reviewRequest.productIds);

      // Prepare email data
      const emailData = {
        to: reviewRequest.customerEmail,
        subject: settings.emailSubject || "How was your recent purchase?",
        customerName: reviewRequest.customerName,
        orderNumber: reviewRequest.orderNumber,
        reviewLink: reviewLink,
        productNames: productNames,
        storeUrl: `https://${reviewRequest.shop}`
      };

      // Create email content based on provider
      const provider = settings.emailProvider || 'klaviyo';
      let emailContent;
      
      if (provider === 'klaviyo') {
        emailContent = createKlaviyoEmailTemplate(emailData);
      } else {
        emailContent = createReviewEmailTemplate(emailData);
      }
      
      emailData.message = emailContent;

      // Send email using configured provider
      const emailResult = await this.sendUsingProvider(
        provider,
        settings.apiKey,
        'email',
        emailData
      );

      // Send WhatsApp if enabled and phone number available
      let whatsappResult = null;
      if (settings.whatsappProvider && reviewRequest.customerPhone) {
        const whatsappData = {
          to: reviewRequest.customerPhone,
          customerName: reviewRequest.customerName,
          orderNumber: reviewRequest.orderNumber,
          reviewLink: reviewLink
        };

        const whatsappContent = createWhatsAppTemplate(whatsappData);
        whatsappData.message = whatsappContent;

        whatsappResult = await this.sendUsingProvider(
          settings.whatsappProvider,
          settings.apiKey,
          'whatsapp',
          whatsappData
        );
      }

      // Update review request status
      const updateData = {
        status: emailResult.success ? 'sent' : 'failed',
        emailSent: emailResult.success,
        whatsappSent: whatsappResult ? whatsappResult.success : false,
        sentAt: emailResult.success ? new Date() : null,
        errorMessage: emailResult.success ? null : emailResult.error,
        updatedAt: new Date()
      };

      await db.reviewRequest.update({
        where: { id: reviewRequest.id },
        data: updateData
      });

      console.log(`📊 Email result: ${emailResult.success ? '✅ Success' : '❌ Failed'}`);
      if (whatsappResult) {
        console.log(`📱 WhatsApp result: ${whatsappResult.success ? '✅ Success' : '❌ Failed'}`);
      }

      return {
        success: emailResult.success,
        emailResult,
        whatsappResult,
        reviewRequestId: reviewRequest.id
      };

    } catch (error) {
      console.error(`❌ Failed to send review request:`, error);
      
      // Update review request with error
      await db.reviewRequest.update({
        where: { id: reviewRequest.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          updatedAt: new Date()
        }
      });

      return {
        success: false,
        error: error.message,
        reviewRequestId: reviewRequest.id
      };
    }
  }

  /**
   * Send using specific provider
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key
   * @param {string} channel - 'email' or 'whatsapp'
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Send result
   */
  async sendUsingProvider(provider, apiKey, channel, data) {
    try {
      console.log(`🔍 EmailService.sendUsingProvider called:`);
      console.log(`   Provider: ${provider}`);
      console.log(`   Channel: ${channel}`);
      console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NULL/UNDEFINED'}`);
      console.log(`   Data: ${JSON.stringify({to: data.to, subject: data.subject}, null, 2)}`);

      const ProviderClass = this.providers[provider.toLowerCase()];
      
      if (!ProviderClass) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!apiKey) {
        throw new Error(`API key not configured for provider: ${provider}`);
      }

      console.log(`🏗️  Creating ${provider} service with API key: ${apiKey.substring(0, 20)}...`);
      const service = new ProviderClass(apiKey);

      console.log(`📧 Calling ${provider}.${channel === 'email' ? 'sendEmail' : 'sendWhatsApp'}()`);

      if (channel === 'email') {
        return await service.sendEmail(data);
      } else if (channel === 'whatsapp') {
        return await service.sendWhatsApp(data);
      } else {
        throw new Error(`Unsupported channel: ${channel}`);
      }

    } catch (error) {
      console.error(`❌ Provider ${provider} ${channel} failed:`, error.message);
      return {
        success: false,
        error: error.message,
        provider: provider,
        channel: channel
      };
    }
  }

  /**
   * Create review link for customer
   * @param {Object} reviewRequest - Review request data
   * @returns {string} Review link URL
   */
  createReviewLink(reviewRequest) {
    // Extract first product ID for the review link
    const productIds = JSON.parse(reviewRequest.productIds || '[]');
    const firstProductId = productIds[0] || '0';
    
    // Create review link - this should point to your review form
    // You might want to make this configurable in settings
    const baseUrl = `https://${reviewRequest.shop}`;
    return `${baseUrl}/pages/write-review?product=${firstProductId}&order=${reviewRequest.orderId}&email=${encodeURIComponent(reviewRequest.customerEmail)}`;
  }

  /**
   * Get product names from product IDs
   * @param {string} productIdsJson - JSON string of product IDs
   * @returns {Promise<Array>} Array of product names
   */
  async getProductNames(productIdsJson) {
    try {
      const productIds = JSON.parse(productIdsJson || '[]');
      
      // In a real implementation, you might fetch product names from Shopify API
      // For now, we'll return placeholder names
      return productIds.map(id => `Product ${id}`);
      
    } catch (error) {
      console.error('Error parsing product IDs:', error);
      return [];
    }
  }

  /**
   * Test provider connection
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} Test result
   */
  async testProvider(provider, apiKey) {
    try {
      const ProviderClass = this.providers[provider.toLowerCase()];
      
      if (!ProviderClass) {
        return {
          success: false,
          message: `Unsupported provider: ${provider}`
        };
      }

      if (!apiKey) {
        return {
          success: false,
          message: `API key required for provider: ${provider}`
        };
      }

      const service = new ProviderClass(apiKey);
      return await service.testConnection();

    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  }

  /**
   * Process pending review requests
   * @param {string} shop - Shop domain
   * @returns {Promise<Object>} Processing result
   */
  async processPendingRequests(shop) {
    try {
      console.log(`🔄 Processing pending review requests for shop: ${shop}`);

      // Get automation settings
      const settings = await db.emailAutomationSettings.findUnique({
        where: { shop }
      });

      if (!settings || !settings.enabled) {
        console.log(`📭 Email automation disabled for shop: ${shop}`);
        return { processed: 0, message: 'Email automation disabled' };
      }

      // Get pending review requests that are ready to send
      const now = new Date();
      const pendingRequests = await db.reviewRequest.findMany({
        where: {
          shop,
          status: 'pending',
          scheduledSendDate: {
            lte: now
          }
        },
        orderBy: {
          scheduledSendDate: 'asc'
        },
        take: 10 // Process max 10 at a time
      });

      console.log(`📋 Found ${pendingRequests.length} pending requests ready to send`);

      const results = [];
      for (const request of pendingRequests) {
        const result = await this.sendReviewRequest(request, settings);
        results.push(result);
        
        // Add small delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      console.log(`✅ Processed ${results.length} requests: ${successCount} sent, ${failedCount} failed`);

      return {
        processed: results.length,
        sent: successCount,
        failed: failedCount,
        results: results
      };

    } catch (error) {
      console.error(`❌ Error processing pending requests:`, error);
      return {
        processed: 0,
        error: error.message
      };
    }
  }
} 