import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { 
  Page, 
  Card, 
  Badge, 
  Text,
  BlockStack,
  Button,
  ButtonGroup,
  InlineStack,
  Thumbnail,
  Grid,
  Box,
  Divider,
  Icon
} from "@shopify/polaris";
import { StarFilledIcon, ImageIcon, CalendarIcon, PersonIcon } from "@shopify/polaris-icons";
import { authenticate } from "~/shopify.server";
import { prisma } from "~/utils/db.server";

// Server-side action to handle moderation
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const reviewId = parseInt(formData.get("reviewId"));
  const actionType = formData.get("action");
  
  try {
    switch (actionType) {
      case "approve":
        await prisma.review.update({
          where: { id: reviewId, shop },
          data: { approved: true }
        });
        break;
        
      case "reject":
        await prisma.review.update({
          where: { id: reviewId, shop },
          data: { approved: false }
        });
        break;
        
      case "delete":
        await prisma.review.delete({
          where: { id: reviewId, shop }
        });
        break;
        
      default:
        throw new Error("Invalid action");
    }
    
    return json({ success: true, action: actionType });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 400 });
  }
};

// Server-side loader to fetch reviews
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const reviews = await prisma.review.findMany({ 
    where: { shop },
    include: {
      productGroup: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Calculate stats
  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.approved).length,
    pending: reviews.filter(r => !r.approved).length,
    withImages: reviews.filter(r => {
      try {
        const urls = JSON.parse(r.mediaUrls || '[]');
        return urls.length > 0;
      } catch {
        return false;
      }
    }).length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0
  };
  
  return json({ reviews, stats });
};

const StarRating = ({ rating }) => {
  return (
    <InlineStack gap="100">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          source={StarFilledIcon}
          tone={star <= rating ? "warning" : "subdued"}
        />
      ))}
      <Text variant="bodySm" tone="subdued">
        {rating}/5
      </Text>
    </InlineStack>
  );
};

const MediaGallery = ({ mediaUrls }) => {
  let urls = [];
  try {
    urls = JSON.parse(mediaUrls || '[]');
  } catch {
    return null;
  }
  
  if (urls.length === 0) return (
    <Box paddingBlock="200">
      <InlineStack align="center" gap="200">
        <Icon source={ImageIcon} tone="subdued" />
        <Text variant="bodySm" tone="subdued">No images</Text>
      </InlineStack>
    </Box>
  );
  
  return (
    <InlineStack gap="200" wrap={false}>
      {urls.slice(0, 3).map((url, index) => (
        <Thumbnail
          key={index}
          source={url}
          alt={`Review image ${index + 1}`}
          size="small"
        />
      ))}
      {urls.length > 3 && (
        <Box 
          paddingInline="200" 
          paddingBlock="100"
          background="bg-surface-secondary"
          borderRadius="100"
        >
          <Text variant="bodySm" tone="subdued">
            +{urls.length - 3}
          </Text>
        </Box>
      )}
    </InlineStack>
  );
};

// Client-side component
export default function ReviewsPage() {
  const { reviews, stats } = useLoaderData();
  const submit = useSubmit();

  const handleAction = (reviewId, action) => {
    const formData = new FormData();
    formData.append("reviewId", reviewId.toString());
    formData.append("action", action);
    submit(formData, { method: "post" });
  };

  const createActionButtons = (review) => (
    <ButtonGroup>
      {!review.approved ? (
        <Button
          size="micro"
          tone="success"
          onClick={() => handleAction(review.id, "approve")}
        >
          Approve
        </Button>
      ) : (
        <Button
          size="micro"
          tone="critical"
          variant="tertiary"
          onClick={() => handleAction(review.id, "reject")}
        >
          Reject
        </Button>
      )}
      <Button
        size="micro"
        tone="critical"
        onClick={() => handleAction(review.id, "delete")}
      >
        Delete
      </Button>
    </ButtonGroup>
  );

  return (
    <Page title="Customer Reviews" subtitle="Manage and moderate customer feedback">
      <BlockStack gap="500">
        {/* Statistics Cards */}
        <Grid>
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h3">
                  {stats.total}
                </Text>
                <Text variant="bodyMd" tone="subdued">
                  Total Reviews
                </Text>
              </BlockStack>
            </Card>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingLg" as="h3" tone="success">
                    {stats.approved}
                  </Text>
                  <Badge tone="success">Approved</Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  Approved Reviews
                </Text>
              </BlockStack>
            </Card>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingLg" as="h3" tone="warning">
                    {stats.pending}
                  </Text>
                  <Badge tone="attention">Pending</Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  Pending Reviews
                </Text>
              </BlockStack>
            </Card>
          </Grid.Cell>
          
          <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" align="start">
                  <Text variant="headingLg" as="h3">
                    {stats.averageRating}
                  </Text>
                  <Icon source={StarFilledIcon} tone="warning" />
                </InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  Average Rating
                </Text>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        {/* Reviews List */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                Recent Reviews
              </Text>
              <Text variant="bodyMd" tone="subdued">
                {stats.withImages} reviews with images
              </Text>
            </InlineStack>
            
            {reviews.length === 0 ? (
              <Box paddingBlock="800" paddingInline="400">
                <BlockStack align="center" gap="400">
                  <Icon source={PersonIcon} tone="subdued" />
                  <Text variant="bodyMd" tone="subdued" alignment="center">
                    No reviews found. Reviews will appear here once customers submit them.
                  </Text>
                </BlockStack>
              </Box>
            ) : (
              <BlockStack gap="400">
                {reviews.map((review, index) => (
                  <div key={review.id}>
                    <Card padding="400">
                      <BlockStack gap="400">
                        {/* Header with customer and status */}
                        <InlineStack align="space-between" blockAlign="start">
                          <BlockStack gap="200">
                            <InlineStack gap="300" blockAlign="center">
                              <Text variant="headingSm" as="h3">
                                {review.customerName}
                              </Text>
                              {review.approved ? (
                                <Badge tone="success">Approved</Badge>
                              ) : (
                                <Badge tone="attention">Pending Approval</Badge>
                              )}
                            </InlineStack>
                            
                            <InlineStack gap="400" blockAlign="center">
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={CalendarIcon} tone="subdued" />
                                <Text variant="bodySm" tone="subdued">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Text>
                              </InlineStack>
                              
                              <Text variant="bodySm" tone="subdued">
                                Product: {review.productId}
                              </Text>
                              
                              {review.productGroup && (
                                <Badge tone="info">{review.productGroup.name}</Badge>
                              )}
                            </InlineStack>
                          </BlockStack>
                          
                          {createActionButtons(review)}
                        </InlineStack>
                        
                        {/* Rating */}
                        <StarRating rating={review.rating} />
                        
                        {/* Review Text */}
                        <Text variant="bodyMd">
                          {review.reviewText}
                        </Text>
                        
                        {/* Media Gallery */}
                        <MediaGallery mediaUrls={review.mediaUrls} />
                      </BlockStack>
                    </Card>
                    
                    {index < reviews.length - 1 && (
                      <Box paddingBlock="200">
                        <Divider />
                      </Box>
                    )}
                  </div>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
