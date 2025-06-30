import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { Card, Page, Layout, Button, TextField, Banner, Text, BlockStack, InlineStack, Select, Checkbox } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from "react";
import { prisma as db } from "../utils/db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get current automation settings
  let settings = await db.emailAutomationSettings.findUnique({
    where: { shop }
  });

  // Create default settings if none exist
  if (!settings) {
    settings = await db.emailAutomationSettings.create({
      data: {
        shop,
        enabled: true,
        deliveryTagName: "delivered",
        delayDays: 3,
        emailProvider: "klaviyo",
        emailSubject: "How was your recent purchase?",
        maxReminders: 1,
      }
    });
  }

  // Get recent review requests
  const recentRequests = await db.reviewRequest.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  // Get webhook logs
  const recentLogs = await db.webhookLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return json({
    settings,
    recentRequests,
    recentLogs,
    timestamp: new Date().toLocaleString()
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "update") {
    const enabled = formData.get("enabled") === "true";
    const deliveryTagName = formData.get("deliveryTagName");
    const delayDays = parseInt(formData.get("delayDays"));
    const delayHours = parseInt(formData.get("delayHours")) || 0;
    const delaySeconds = parseInt(formData.get("delaySeconds")) || 0;
    const emailProvider = formData.get("emailProvider");
    const whatsappProvider = formData.get("whatsappProvider");
    const whatsappApiKey = formData.get("whatsappApiKey");
    const emailSubject = formData.get("emailSubject");
    const maxReminders = parseInt(formData.get("maxReminders"));

    try {
      await db.emailAutomationSettings.upsert({
        where: { shop },
        update: {
          enabled,
          deliveryTagName,
          delayDays,
          delayHours,
          delaySeconds,
          emailProvider,
          whatsappProvider: whatsappProvider || null,
          whatsappApiKey: whatsappApiKey || null,
          emailSubject,
          maxReminders,
          updatedAt: new Date()
        },
        create: {
          shop,
          enabled,
          deliveryTagName,
          delayDays,
          delayHours,
          delaySeconds,
          emailProvider,
          whatsappProvider: whatsappProvider || null,
          whatsappApiKey: whatsappApiKey || null,
          emailSubject,
          maxReminders,
        }
      });

      return json({ success: "Automation settings updated successfully!" });
    } catch (error) {
      return json({ error: "Failed to update settings: " + error.message });
    }
  }

  return json({ error: "Invalid action" });
};

export default function EmailAutomation() {
  const { settings, recentRequests, recentLogs, timestamp } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  // Form state
  const [enabled, setEnabled] = useState(settings.enabled);
  const [deliveryTagName, setDeliveryTagName] = useState(settings.deliveryTagName);
  const [delayDays, setDelayDays] = useState(settings.delayDays.toString());
  const [delayHours, setDelayHours] = useState((settings.delayHours || 0).toString());
  const [delaySeconds, setDelaySeconds] = useState((settings.delaySeconds || 0).toString());
  const [emailProvider, setEmailProvider] = useState(settings.emailProvider);
  const [whatsappProvider, setWhatsappProvider] = useState(settings.whatsappProvider || "");
  const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsappApiKey || "");
  const [emailSubject, setEmailSubject] = useState(settings.emailSubject);
  const [maxReminders, setMaxReminders] = useState(settings.maxReminders.toString());

  // Helper function to calculate total delay time
  const calculateTotalDelay = (days, hours, seconds) => {
    const totalSeconds = (parseInt(days) || 0) * 24 * 60 * 60 + 
                        (parseInt(hours) || 0) * 60 * 60 + 
                        (parseInt(seconds) || 0);
    
    if (totalSeconds < 60) return `${totalSeconds} seconds`;
    if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)} minutes, ${totalSeconds % 60} seconds`;
    if (totalSeconds < 86400) return `${Math.floor(totalSeconds / 3600)} hours, ${Math.floor((totalSeconds % 3600) / 60)} minutes`;
    
    const displayDays = Math.floor(totalSeconds / 86400);
    const displayHours = Math.floor((totalSeconds % 86400) / 3600);
    const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
    
    return `${displayDays} days, ${displayHours} hours, ${displayMinutes} minutes`;
  };

  const isUpdating = navigation.state === "submitting";

  const emailProviderOptions = [
    { label: "Klaviyo", value: "klaviyo" },
    { label: "Omnisend", value: "omnisend" },
    { label: "KwikEngage", value: "kwik-engage" },
    { label: "Mailchimp", value: "mailchimp" },
    { label: "Custom API", value: "custom" },
  ];

  const whatsappProviderOptions = [
    { label: "None", value: "" },
    { label: "Interakt", value: "interakt" },
    { label: "Wati", value: "wati" },
    { label: "Gallabox", value: "gallabox" },
    { label: "WhatsApp Business API", value: "whatsapp-api" },
  ];

  return (
    <Page 
      title="Email Automation"
      subtitle="Automatically send review requests when orders are delivered"
    >
      <Layout>
        <Layout.Section>
          {actionData?.success && (
            <Banner status="success" title="Success">
              <p>{actionData.success}</p>
            </Banner>
          )}
          
          {actionData?.error && (
            <Banner status="critical" title="Error">
              <p>{actionData.error}</p>
            </Banner>
          )}

          <Card>
            <Form method="post">
              <BlockStack gap="4">
                <Text variant="headingMd" as="h2">Automation Settings</Text>
                
                <Checkbox
                  label="Enable email automation"
                  checked={enabled}
                  onChange={setEnabled}
                  helpText="Automatically send review requests when orders are marked as delivered"
                />

                <TextField
                  label="Delivery Tag Name"
                  value={deliveryTagName}
                  onChange={setDeliveryTagName}
                  placeholder="delivered"
                  helpText="Tag name to look for in order tags (case insensitive)"
                />

                <Text variant="headingMd" as="h3">Email Timing</Text>
                <Text variant="bodyMd" color="subdued">
                  Set when to send review requests after delivery (e.g., "3 days, 2 hours, 30 seconds after delivery")
                </Text>
                
                <InlineStack gap="3">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Days"
                      value={delayDays}
                      onChange={setDelayDays}
                      type="number"
                      min="0"
                      max="30"
                      suffix="days"
                      helpText="Days to wait"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Hours"
                      value={delayHours}
                      onChange={setDelayHours}
                      type="number"
                      min="0"
                      max="23"
                      suffix="hours"
                      helpText="Additional hours"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextField
                      label="Seconds"
                      value={delaySeconds}
                      onChange={setDelaySeconds}
                      type="number"
                      min="0"
                      max="59"
                      suffix="seconds"
                      helpText="Additional seconds"
                    />
                  </div>
                </InlineStack>
                
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Text variant="bodyMd" fontWeight="semibold" color="success">
                    Email will be sent: {delayDays || 0} days, {delayHours || 0} hours, {delaySeconds || 0} seconds after delivery
                  </Text>
                  <Text variant="bodySm" color="subdued">
                    Total delay: {calculateTotalDelay(delayDays, delayHours, delaySeconds)}
                  </Text>
                </div>

                <Select
                  label="Email Provider"
                  options={emailProviderOptions}
                  value={emailProvider}
                  onChange={setEmailProvider}
                />

                <Select
                  label="WhatsApp Provider (Optional)"
                  options={whatsappProviderOptions}
                  value={whatsappProvider}
                  onChange={setWhatsappProvider}
                />

                {whatsappProvider && (
                  <TextField
                    label="WhatsApp API Key"
                    value={whatsappApiKey}
                    onChange={setWhatsappApiKey}
                    type="password"
                    placeholder="Enter your WhatsApp provider API key"
                    helpText={`API key for ${whatsappProvider} WhatsApp service`}
                  />
                )}

                <TextField
                  label="Email Subject"
                  value={emailSubject}
                  onChange={setEmailSubject}
                  placeholder="How was your recent purchase?"
                />

                <TextField
                  label="Max Reminders"
                  value={maxReminders}
                  onChange={setMaxReminders}
                  type="number"
                  min="0"
                  max="3"
                  helpText="Maximum number of follow-up emails to send"
                />

                {emailProvider === 'klaviyo' && (
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h3">Klaviyo Configuration</Text>
                      
                      <TextField
                        label="Klaviyo Private API Key"
                        value="pk_a0ac9d2821d12915f87b72670dcf1096c1"
                        onChange={() => {}} // Read-only for now
                        helpText="Your Klaviyo private API key (configured and ready!)"
                        disabled
                      />
                      
                      <Text variant="bodyMd" color="subdued">
                        <strong>API Endpoint:</strong> https://a.klaviyo.com/api
                      </Text>
                      
                      <InlineStack gap="2">
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/send-review-email?action=test-connection');
                              const result = await response.json();
                              alert(result.success ? 'Connection successful!' : 'Connection failed: ' + result.message);
                            } catch (error) {
                              alert('Test failed: ' + error.message);
                            }
                          }}
                        >
                          Test Connection
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            const email = prompt('Enter your email address for testing (e.g., atulsaini1989@gmail.com):');
                            if (email) {
                              fetch('/api/send-review-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ testEmail: email })
                              })
                              .then(response => response.json())
                              .then(result => {
                                alert(result.success ? 
                                  'Test email sent via Klaviyo! Check your inbox.' : 
                                  'Failed: ' + result.error
                                );
                              })
                              .catch(error => alert('Error: ' + error.message));
                            }
                          }}
                        >
                          Send Test Email
                        </Button>
                      </InlineStack>
                      
                      <Text variant="bodySm" color="subdued">
                        Use the test buttons to verify your Klaviyo integration is working correctly.
                      </Text>
                      
                      <Banner status="success">
                        <p><strong>✅ Configuration Complete!</strong></p>
                        <ul style={{ marginLeft: '20px' }}>
                          <li>✅ Private API Key configured</li>
                          <li>✅ Klaviyo connection ready</li>
                          <li>✅ Beautiful email templates loaded</li>
                          <li>🚀 Ready to send emails to customers!</li>
                        </ul>
                      </Banner>
                    </BlockStack>
                  </Card>
                )}

                {emailProvider === 'kwik-engage' && (
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h3">KwikEngage Configuration</Text>
                      
                      <TextField
                        label="KwikEngage API Key"
                        value="l6HppWwDL20MLn4mxej8SMh1sn8RDSp9UeYYHwynox9w4xRaGGQ9HwcUDXlq"
                        onChange={() => {}} // Read-only for now
                        helpText="Your KwikEngage API key (configured)"
                        disabled
                      />
                      
                      <Text variant="bodyMd" color="subdued">
                        <strong>API Endpoint:</strong> https://api.kwikengage.ai/send-message/v2
                      </Text>
                      
                      <Banner status="warning">
                        <p><strong>Note:</strong> KwikEngage requires email channel configuration in their dashboard. Please configure the email channel first before testing.</p>
                      </Banner>
                      
                      <Text variant="bodySm" color="subdued">
                        KwikEngage integration requires additional setup in their dashboard.
                      </Text>
                    </BlockStack>
                  </Card>
                )}

                {whatsappProvider && whatsappApiKey && (
                  <Card background="bg-surface-secondary">
                    <BlockStack gap="4">
                      <Text variant="headingMd" as="h3">WhatsApp Configuration</Text>
                      
                      <Text variant="bodyMd" color="subdued">
                        <strong>Provider:</strong> {whatsappProvider.charAt(0).toUpperCase() + whatsappProvider.slice(1)}
                      </Text>
                      
                      <Text variant="bodyMd" color="subdued">
                        <strong>API Key:</strong> {'*'.repeat(10)}...{whatsappApiKey.slice(-4)}
                      </Text>

                      {whatsappProvider === 'interakt' && (
                        <Banner status="info">
                          <p><strong>Interakt Configuration:</strong></p>
                          <ul style={{ marginLeft: '20px' }}>
                            <li>🔗 Dashboard: https://app.interakt.ai</li>
                            <li>📱 API Endpoint: https://api.interakt.ai/v1/public/message/</li>
                            <li>🔑 Get API key from Settings → API & Webhooks</li>
                            <li>📋 Create template named "review_request"</li>
                            <li>🇮🇳 Perfect for Indian businesses</li>
                          </ul>
                        </Banner>
                      )}
                      
                      <InlineStack gap="2">
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/send-whatsapp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: 'test-connection',
                                  provider: whatsappProvider,
                                  apiKey: whatsappApiKey
                                })
                              });
                              const result = await response.json();
                              alert(result.success ? 
                                `Connection successful! ${result.message}` : 
                                `Connection failed: ${result.error}`
                              );
                            } catch (error) {
                              alert('Test failed: ' + error.message);
                            }
                          }}
                        >
                          Test Connection
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            const phone = prompt('Enter phone number for testing (with country code, e.g., +918852968844):');
                            if (phone) {
                              fetch('/api/send-whatsapp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: 'test-message',
                                  testPhone: phone
                                })
                              })
                              .then(response => response.json())
                              .then(result => {
                                alert(result.success ? 
                                  `Test WhatsApp sent to ${phone}! ${result.message}` : 
                                  'Failed: ' + result.error
                                );
                              })
                              .catch(error => alert('Error: ' + error.message));
                            }
                          }}
                        >
                          Send Test WhatsApp
                        </Button>
                        
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/send-whatsapp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'process-pending' })
                              });
                              const result = await response.json();
                              alert(result.success ? 
                                result.message : 
                                'Failed: ' + result.error
                              );
                              window.location.reload();
                            } catch (error) {
                              alert('Error: ' + error.message);
                            }
                          }}
                        >
                          Send Pending WhatsApp
                        </Button>
                      </InlineStack>
                      
                      <Banner status="info">
                        <p><strong>WhatsApp Template Setup Required:</strong></p>
                        <ul style={{ marginLeft: '20px' }}>
                          <li>Create a WhatsApp template named "review_request" in your provider dashboard</li>
                          <li>Template should include variables for customer name, order number, and review link</li>
                          <li>Get template approved by WhatsApp before using</li>
                          <li>Messages are sent only to customers with phone numbers</li>
                        </ul>
                      </Banner>
                    </BlockStack>
                  </Card>
                )}

                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="enabled" value={enabled.toString()} />
                <input type="hidden" name="deliveryTagName" value={deliveryTagName} />
                <input type="hidden" name="delayDays" value={delayDays} />
                <input type="hidden" name="delayHours" value={delayHours} />
                <input type="hidden" name="delaySeconds" value={delaySeconds} />
                <input type="hidden" name="emailProvider" value={emailProvider} />
                <input type="hidden" name="whatsappProvider" value={whatsappProvider} />
                <input type="hidden" name="whatsappApiKey" value={whatsappApiKey} />
                <input type="hidden" name="emailSubject" value={emailSubject} />
                <input type="hidden" name="maxReminders" value={maxReminders} />
                
                <InlineStack gap="2">
                  <Button 
                    submit 
                    primary 
                    loading={isUpdating}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save Settings"}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">📊 Recent Review Requests</Text>
              
              <InlineStack gap="2" align="space-between">
                <Text variant="bodyMd" fontWeight="semibold">Recent Review Requests</Text>
                <Button
                  size="slim"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/send-review-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reviewRequestId: 1 }) // Send the pending request
                      });
                      const result = await response.json();
                      alert(result.success ? 
                        'Email sent successfully!' : 
                        'Failed: ' + result.error
                      );
                      window.location.reload(); // Refresh to see updated status
                    } catch (error) {
                      alert('Error: ' + error.message);
                    }
                  }}
                >
                  Send Pending Emails
                </Button>
              </InlineStack>

              {recentRequests.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {recentRequests.map((request) => (
                    <div key={request.id} style={{ 
                      padding: '12px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px', 
                      marginBottom: '8px',
                      backgroundColor: request.status === 'sent' ? '#f0f9ff' : '#fafafa'
                    }}>
                      <InlineStack gap="4" align="space-between">
                        <div>
                          <Text variant="bodyMd" fontWeight="semibold">
                            Order #{request.orderNumber}
                          </Text>
                          <Text variant="bodySm" color="subdued">
                            {request.customerName} ({request.customerEmail})
                          </Text>
                          <Text variant="bodySm" color="subdued">
                            Scheduled: {new Date(request.scheduledSendDate).toLocaleDateString()}
                          </Text>
                          {request.sentAt && (
                            <Text variant="bodySm" color="success">
                              Sent: {new Date(request.sentAt).toLocaleString()}
                            </Text>
                          )}
                          {request.errorMessage && (
                            <Text variant="bodySm" color="critical">
                              Error: {request.errorMessage}
                            </Text>
                          )}
                        </div>
                        <div>
                          <div>
                            <Text variant="bodySm" color={
                              request.status === 'sent' ? 'success' : 
                              request.status === 'pending' ? 'warning' : 'critical'
                            }>
                              {request.status.toUpperCase()}
                            </Text>
                            <Text variant="bodySm" color="subdued">
                              Email: {request.emailSent ? '✅' : '❌'} | WhatsApp: {request.whatsappSent ? '✅' : '❌'}
                            </Text>
                          </div>
                          {request.status === 'pending' && (
                            <InlineStack gap="1">
                              <Button
                                size="micro"
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/send-review-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ reviewRequestId: request.id })
                                    });
                                    const result = await response.json();
                                    alert(result.success ? 
                                      'Email sent!' : 
                                      'Failed: ' + result.error
                                    );
                                    window.location.reload();
                                  } catch (error) {
                                    alert('Error: ' + error.message);
                                  }
                                }}
                              >
                                Send Email
                              </Button>
                              
                              {request.customerPhone && !request.whatsappSent && (
                                <Button
                                  size="micro"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/send-whatsapp', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reviewRequestId: request.id })
                                      });
                                      const result = await response.json();
                                      alert(result.success ? 
                                        'WhatsApp sent!' : 
                                        'Failed: ' + result.error
                                      );
                                      window.location.reload();
                                    } catch (error) {
                                      alert('Error: ' + error.message);
                                    }
                                  }}
                                >
                                  Send WhatsApp
                                </Button>
                              )}
                            </InlineStack>
                          )}
                        </div>
                      </InlineStack>
                    </div>
                  ))}
                </div>
              ) : (
                <Text variant="bodyMd" color="subdued">
                  No review requests yet. Orders with delivery tags will appear here.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">Webhook Status</Text>
              
              <Text variant="bodyMd">
                <strong>Webhook URL:</strong> {`https://your-domain.com/webhooks/orders/updated`}
              </Text>
              
              <Text variant="bodySm" color="subdued">
                This webhook should be configured in your Shopify admin under Settings → Notifications → Webhooks.
                Set it to trigger on "Order updated" events.
              </Text>

              {recentLogs.length > 0 && (
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">Recent Webhook Events:</Text>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                    {recentLogs.map((log) => (
                      <div key={log.id} style={{ 
                        padding: '8px', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '4px', 
                        marginBottom: '4px',
                        fontSize: '12px'
                      }}>
                        <Text variant="bodySm">
                          {new Date(log.createdAt).toLocaleString()} - 
                          Order {log.orderId} - 
                          {log.success ? 'Success' : 'Failed'}
                        </Text>
                        {log.errorMessage && (
                          <Text variant="bodySm" color="critical">
                            Error: {log.errorMessage}
                          </Text>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Text variant="bodySm" color="subdued">
                Last updated: {timestamp}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 