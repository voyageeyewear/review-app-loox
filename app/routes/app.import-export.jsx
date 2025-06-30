import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { Card, Page, Layout, Button, TextField, Banner, Text, BlockStack, InlineStack, DataTable, Badge, Checkbox } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { prisma as db } from "../utils/db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const recentReviews = await db.review.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const totalReviews = await db.review.count({
    where: { shop }
  });

  const approvedReviews = await db.review.count({
    where: { shop, approved: true }
  });

  return json({
    recentReviews,
    stats: {
      total: totalReviews,
      approved: approvedReviews,
      pending: totalReviews - approvedReviews
    }
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "import") {
    try {
      const csvContent = formData.get("csvContent");
      
      if (!csvContent) {
        return json({ error: "CSV content is required" });
      }

      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) continue;
        
        const reviewData = {};
        headers.forEach((header, index) => {
          reviewData[header] = values[index];
        });

        if (!reviewData.productId || !reviewData.customerName || !reviewData.rating) {
          continue;
        }

        await db.review.create({
          data: {
            shop,
            productId: reviewData.productId,
            customerName: reviewData.customerName,
            rating: parseInt(reviewData.rating) || 5,
            reviewText: reviewData.reviewText || "",
            mediaUrls: reviewData.mediaUrls || "",
            approved: reviewData.approved === 'true'
          }
        });
        
        importedCount++;
      }

      return json({ 
        success: `Successfully imported ${importedCount} reviews!`
      });

    } catch (error) {
      return json({ error: "Failed to import reviews: " + error.message });
    }
  }

  if (action === "export") {
    try {
      const reviews = await db.review.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" }
      });

      const csvHeaders = ['productId', 'customerName', 'rating', 'reviewText', 'mediaUrls', 'approved', 'createdAt'];
      const csvRows = reviews.map(review => [
        review.productId,
        `"${review.customerName}"`,
        review.rating,
        `"${review.reviewText}"`,
        `"${review.mediaUrls}"`,
        review.approved,
        review.createdAt.toISOString()
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      return json({
        success: `Exported ${reviews.length} reviews successfully!`,
        csvContent,
        filename: `reviews_export_${new Date().toISOString().split('T')[0]}.csv`
      });

    } catch (error) {
      return json({ error: "Failed to export reviews: " + error.message });
    }
  }

  return json({ error: "Invalid action" });
};

export default function ImportExport() {
  const { recentReviews, stats } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const [csvContent, setCsvContent] = useState("");

  const sampleCsvContent = `productId,customerName,rating,reviewText,mediaUrls,approved,createdAt
9038857732326,"John Smith",5,"Amazing product! Love the quality.","",true,2025-06-29T10:00:00Z
9038857732327,"Sarah Johnson",4,"Good value for money. Fast shipping.","",true,2025-06-28T15:30:00Z
9038857732328,"Mike Wilson",5,"Outstanding! Exactly what I needed.","",true,2025-06-27T09:15:00Z`;

  const downloadCsv = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Page title="Import/Export Reviews">
      <Layout>
        <Layout.Section>
          {actionData?.success && (
            <Banner status="success">
              <p>{actionData.success}</p>
            </Banner>
          )}
          
          {actionData?.error && (
            <Banner status="critical">
              <p>{actionData.error}</p>
            </Banner>
          )}

          {actionData?.csvContent && (
            <Banner status="info">
              <p>Your CSV export is ready!</p>
              <Button onClick={() => downloadCsv(actionData.csvContent, actionData.filename)}>
                Download CSV
              </Button>
            </Banner>
          )}

          <InlineStack gap="4">
            <Card>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Text variant="headingLg">{stats.total}</Text>
                <Text>Total Reviews</Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Text variant="headingLg">{stats.approved}</Text>
                <Text>Approved</Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Text variant="headingLg">{stats.pending}</Text>
                <Text>Pending</Text>
              </div>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Import Reviews</Text>
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #0ea5e9'
              }}>
                <Text variant="headingMd" as="h3">CSV Format Requirements</Text>
                <BlockStack gap="2">
                  <Text><strong>Required Columns:</strong></Text>
                  <ul style={{ marginLeft: '20px' }}>
                    <li><strong>productId</strong> - Product identifier (string/number)</li>
                    <li><strong>customerName</strong> - Customer's full name (string)</li>
                    <li><strong>rating</strong> - Star rating from 1-5 (number)</li>
                  </ul>
                  
                  <Text><strong>Optional Columns:</strong></Text>
                  <ul style={{ marginLeft: '20px' }}>
                    <li><strong>reviewText</strong> - Review content (string)</li>
                    <li><strong>mediaUrls</strong> - Image/video URLs (string)</li>
                    <li><strong>approved</strong> - true/false (boolean)</li>
                    <li><strong>createdAt</strong> - Date in ISO format (string)</li>
                  </ul>
                  
                  <Text><strong>Tips:</strong></Text>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>Use quotes around text with commas: "Great product, love it!"</li>
                    <li>Leave empty cells blank (no spaces)</li>
                    <li>Dates should be in ISO format: 2025-06-29T10:00:00Z</li>
                    <li>Boolean values: true/false or 1/0</li>
                  </ul>
                </BlockStack>
              </div>
              
              <Form method="post">
                <BlockStack gap="4">
                  <TextField
                    label="CSV Content"
                    value={csvContent}
                    onChange={setCsvContent}
                    multiline={8}
                    placeholder="Paste your CSV content here..."
                  />

                  <Button onClick={() => setCsvContent(sampleCsvContent)}>
                    Use Sample Data
                  </Button>

                  <Button 
                    onClick={() => {
                      const sampleCsvForDownload = `productId,customerName,rating,reviewText,mediaUrls,approved,createdAt
9038857732326,"John Smith",5,"Amazing product! Love the quality and design.","",true,2025-06-29T10:00:00Z
9038857732327,"Sarah Johnson",4,"Good value for money. Fast shipping too.","",true,2025-06-28T15:30:00Z
9038857732328,"Mike Wilson",5,"Outstanding! Exactly what I needed.","",true,2025-06-27T09:15:00Z
9038857732329,"Emily Davis",3,"Decent product but could be better.","",false,2025-06-26T14:45:00Z
9038857732330,"David Brown",5,"Excellent quality! Highly recommend.","",true,2025-06-25T11:20:00Z`;
                      downloadCsv(sampleCsvForDownload, 'sample-reviews-import.csv');
                    }}
                  >
                    Download Sample CSV
                  </Button>

                  <input type="hidden" name="action" value="import" />
                  <input type="hidden" name="csvContent" value={csvContent} />
                  
                  <Button submit primary disabled={!csvContent.trim()}>
                    Import Reviews
                  </Button>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Export Reviews</Text>
              
              <Form method="post">
                <input type="hidden" name="action" value="export" />
                <Button submit primary>
                  Export All Reviews
                </Button>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Recent Reviews</Text>
              
              {recentReviews.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Product ID', 'Customer', 'Rating', 'Review']}
                  rows={recentReviews.map(review => [
                    review.productId,
                    review.customerName,
                    `${review.rating} stars`,
                    review.reviewText.substring(0, 50) + "..."
                  ])}
                />
              ) : (
                <Text>No reviews yet. Import some to get started!</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 