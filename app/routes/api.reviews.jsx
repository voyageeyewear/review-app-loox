import { json } from "@remix-run/node";
import { prisma } from "~/utils/db.server";

// Handle CORS preflight requests
export const options = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "5");
  const shop = url.searchParams.get("shop") || "tryongoeye.myshopify.com"; // Default for development
  
  // CORS headers for cross-origin requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  
  if (!productId) {
    return json({
      success: false,
      error: "Product ID is required"
    }, { status: 400, headers });
  }
  
  try {
    // Check if product belongs to a product group
    const productGroups = await prisma.productGroup.findMany({
      where: { shop: shop }
    });
    
    const productGroup = productGroups.find(group => {
      const productIds = JSON.parse(group.productIds || '[]');
      return productIds.includes(productId);
    });
    
    let whereCondition;
    let groupInfo = null;
    
    if (productGroup) {
      // Product belongs to a group - fetch reviews from all products in the group
      const groupProductIds = JSON.parse(productGroup.productIds || '[]');
      whereCondition = {
        shop: shop,
        productId: { in: groupProductIds },
        approved: true
      };
      groupInfo = {
        id: productGroup.id,
        name: productGroup.name,
        productIds: groupProductIds,
        isGrouped: true
      };
    } else {
      // Product is standalone - fetch reviews only for this product
      whereCondition = {
        shop: shop,
        productId: productId,
        approved: true
      };
      groupInfo = {
        isGrouped: false
      };
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Fetch approved reviews (either for single product or product group)
    const reviews = await prisma.review.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });
    
    // Get total count for pagination
    const totalReviews = await prisma.review.count({
      where: whereCondition
    });
    
    // Calculate summary statistics
    const allApprovedReviews = await prisma.review.findMany({
      where: whereCondition,
      select: {
        rating: true
      }
    });
    
    let summary = {
      totalReviews: totalReviews,
      averageRating: 0
    };
    
    if (allApprovedReviews.length > 0) {
      const totalRating = allApprovedReviews.reduce((sum, review) => sum + review.rating, 0);
      summary.averageRating = totalRating / allApprovedReviews.length;
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalReviews / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return json({
      success: true,
      reviews: reviews.map(review => {
        let mediaUrls = [];
        try {
          if (review.mediaUrls) {
            // Try to parse as JSON first
            if (review.mediaUrls.startsWith('[')) {
              mediaUrls = JSON.parse(review.mediaUrls);
            } else {
              // If it's a plain URL string, wrap it in an array
              mediaUrls = [review.mediaUrls];
            }
          }
        } catch (error) {
          // If JSON parsing fails, treat as a single URL string
          mediaUrls = review.mediaUrls ? [review.mediaUrls] : [];
        }
        
        return {
          id: review.id,
          customerName: review.customerName,
          rating: review.rating,
          reviewText: review.reviewText,
          mediaUrls: mediaUrls,
          createdAt: review.createdAt,
          productId: review.productId
        };
      }),
      summary: summary,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalReviews: totalReviews,
        hasNext: hasNext,
        hasPrev: hasPrev,
        limit: limit
      },
      groupInfo: groupInfo
    }, { headers });
    
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return json({
      success: false,
      error: "Failed to fetch reviews"
    }, { status: 500, headers });
  }
}; 