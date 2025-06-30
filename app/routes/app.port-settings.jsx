import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { Card, Page, Layout, Button, TextField, Banner, Text, BlockStack, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from "react";
import fs from 'fs';
import path from 'path';

// File to store port settings
const PORT_SETTINGS_FILE = path.join(process.cwd(), 'port-settings.json');

// Get current port setting
function getCurrentPort() {
  try {
    if (fs.existsSync(PORT_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PORT_SETTINGS_FILE, 'utf8'));
      return data.port || 'Not Set';
    }
  } catch (error) {
    console.error('Error reading port settings:', error);
  }
  return 'Not Set';
}

// Save port setting
function savePort(port) {
  try {
    const data = { 
      port: port,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    };
    fs.writeFileSync(PORT_SETTINGS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving port settings:', error);
    return false;
  }
}

// Update widget files with new port
function updateWidgetFiles(port) {
  const filesToUpdate = [
    'SHOPIFY-THEME-WIDGET-UPDATED.liquid',
    'sections/product-reviews.liquid',
    'public/demo-grouped-reviews.html',
    'public/product-reviews-widget.html'
  ];

  let updatedCount = 0;

  filesToUpdate.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace port numbers in various formats
        content = content.replace(/localhost:\d+/g, `localhost:${port}`);
        content = content.replace(/CURRENT_API_PORT\s*=\s*\d+/g, `CURRENT_API_PORT = ${port}`);
        content = content.replace(/const\s+CURRENT_API_PORT\s*=\s*\d+/g, `const CURRENT_API_PORT = ${port}`);
        content = content.replace(/const\s+currentPort\s*=\s*\d+/g, `const currentPort = ${port}`);
        content = content.replace(/let\s+currentPort\s*=\s*\d+/g, `let currentPort = ${port}`);
        content = content.replace(/const\s+possiblePorts\s*=\s*\[[^\]]+\]/g, `const possiblePorts = [${port}, 61406, 54976, 63731, 55000, 52021, 58064]`);
        content = content.replace(/Tried ports: [^<]+/g, `Tried ports: ${port}, 61406, 54976, 63731, 55000, 52021, 58064`);
        
        fs.writeFileSync(filePath, content);
        updatedCount++;
      }
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error);
    }
  });

  return updatedCount;
}

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const currentPort = getCurrentPort();
  
  // Try to detect current running port from processes
  let detectedPort = 'Not Detected';
  try {
    const { execSync } = require('child_process');
    const result = execSync('ps aux | grep "shopify app dev" | grep -v grep | head -1', { encoding: 'utf8' });
    
    // Also check for running ports from node processes
    const portCheck = execSync('lsof -i -P -n | grep node | grep LISTEN', { encoding: 'utf8' });
    if (portCheck) {
      const ports = portCheck.split('\n')
        .map(line => {
          const match = line.match(/:(\d+)/);
          return match ? match[1] : null;
        })
        .filter(port => port && parseInt(port) > 1000)
        .slice(0, 5);
      
      if (ports.length > 0) {
        detectedPort = ports.join(', ');
      }
    }
  } catch (error) {
    console.log('Could not detect running ports');
  }

  return json({
    currentPort,
    detectedPort,
    timestamp: new Date().toLocaleString()
  });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const action = formData.get("action");
  const port = formData.get("port");

  if (action === "update" && port) {
    const portNumber = parseInt(port);
    
    if (isNaN(portNumber) || portNumber < 3000 || portNumber > 65535) {
      return json({ 
        error: "Please enter a valid port number between 3000 and 65535" 
      });
    }

    // Save the port
    const saved = savePort(portNumber);
    if (!saved) {
      return json({ 
        error: "Failed to save port settings" 
      });
    }

    // Update widget files
    const updatedFiles = updateWidgetFiles(portNumber);

    return json({ 
      success: `Port ${portNumber} saved successfully! Updated ${updatedFiles} widget files.`,
      updatedPort: portNumber,
      updatedFiles
    });
  }

  return json({ error: "Invalid action" });
};

export default function PortSettings() {
  const { currentPort, detectedPort, timestamp } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  // State for the port input
  const [portValue, setPortValue] = useState('');
  
  const isUpdating = navigation.state === "submitting";

  const handlePortChange = useCallback((value) => {
    setPortValue(value);
  }, []);

  const handleSubmit = (event) => {
    if (!portValue || portValue.trim() === '') {
      event.preventDefault();
      alert('Please enter a port number');
      return;
    }
  };

  return (
    <Page 
      title="Port Management"
      subtitle="Manage your development server port settings"
    >
      <Layout>
        <Layout.Section>
          {actionData?.success && (
            <Banner status="success" title="Port Updated Successfully">
              <p>{actionData.success}</p>
            </Banner>
          )}
          
          {actionData?.error && (
            <Banner status="critical" title="Error">
              <p>{actionData.error}</p>
            </Banner>
          )}

          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">Current Port Status</Text>
              
              <InlineStack gap="8">
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">Saved Port:</Text>
                  <Text variant="headingLg" color={currentPort === 'Not Set' ? 'critical' : 'success'}>
                    {currentPort === 'Not Set' ? 'Not Set' : currentPort}
                  </Text>
                </div>
                
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">Detected Running Ports:</Text>
                  <Text variant="bodyMd" color="subdued">
                    {detectedPort}
                  </Text>
                </div>
              </InlineStack>

              <Text variant="bodySm" color="subdued">
                Last checked: {timestamp}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Form method="post" onSubmit={handleSubmit}>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h2">Update Port Settings</Text>
                
                <Text variant="bodyMd" color="subdued">
                  Enter the port number where your development server is running. 
                  This will automatically update all your widget files.
                </Text>

                <TextField
                  label="Development Server Port"
                  value={portValue}
                  onChange={handlePortChange}
                  placeholder="Enter port number (e.g., 53596)"
                  helpText="Port number should be between 3000 and 65535"
                  autoComplete="off"
                  type="text"
                />

                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="port" value={portValue} />
                
                <InlineStack gap="2">
                  <Button 
                    submit 
                    primary 
                    loading={isUpdating}
                    disabled={isUpdating || !portValue}
                  >
                    {isUpdating ? "Updating..." : "Save Port & Update Widgets"}
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    disabled={isUpdating}
                  >
                    Refresh Status
                  </Button>
                  
                  <Button
                    onClick={() => setPortValue(detectedPort.split(',')[0]?.trim() || '')}
                    disabled={isUpdating || detectedPort === 'Not Detected'}
                  >
                    Use Detected Port
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">What This Does</Text>
              
              <Text variant="bodyMd">
                When you save a port number, this tool will automatically update:
              </Text>

              <ul style={{ marginLeft: '20px' }}>
                <li><strong>Shopify Theme Widget:</strong> SHOPIFY-THEME-WIDGET-UPDATED.liquid</li>
                <li><strong>Section Widget:</strong> sections/product-reviews.liquid</li>
                <li><strong>Demo Pages:</strong> public/demo-grouped-reviews.html</li>
                <li><strong>Widget Template:</strong> public/product-reviews-widget.html</li>
              </ul>

              <Text variant="bodyMd" color="subdued">
                After updating the port, copy the updated widget code to your Shopify theme 
                and clear your browser cache for the changes to take effect.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">Quick Access Links</Text>
              
              {currentPort !== 'Not Set' && (
                <BlockStack gap="2">
                  <Text variant="bodyMd" fontWeight="semibold">Current Port URLs:</Text>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>
                      <a 
                        href={`http://localhost:${currentPort}/app/reviews`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#006fbb' }}
                      >
                        Reviews Dashboard
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`http://localhost:${currentPort}/app/product-groups`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#006fbb' }}
                      >
                        Product Groups
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`http://localhost:${currentPort}/api/reviews?productId=9038857732326&limit=10`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#006fbb' }}
                      >
                        API Test (iPhone Reviews)
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`http://localhost:${currentPort}/demo-grouped-reviews.html`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#006fbb' }}
                      >
                        Demo Widget
                      </a>
                    </li>
                  </ul>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 