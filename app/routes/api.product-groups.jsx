import { json } from "@remix-run/node";
import { prisma } from "~/utils/db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop") || "tryongoeye.myshopify.com";
  
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
    // Find product group that contains this product ID
    const productGroups = await prisma.productGroup.findMany({
      where: {
        shop: shop
      }
    });
    
    const productGroup = productGroups.find(group => {
      const productIds = JSON.parse(group.productIds || '[]');
      return productIds.includes(productId);
    });
    
    if (productGroup) {
      return json({
        success: true,
        hasGroup: true,
        productGroup: {
          id: productGroup.id,
          name: productGroup.name,
          description: productGroup.description,
          productIds: JSON.parse(productGroup.productIds || '[]')
        }
      }, { headers });
    } else {
      return json({
        success: true,
        hasGroup: false,
        productGroup: null
      }, { headers });
    }
    
  } catch (error) {
    console.error("Error checking product groups:", error);
    return json({
      success: false,
      error: "Failed to check product groups"
    }, { status: 500, headers });
  }
};

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