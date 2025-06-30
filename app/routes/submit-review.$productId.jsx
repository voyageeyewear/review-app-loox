import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/utils/db.server";

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const productId = params.productId;
  
  // Get form fields
  const customerName = formData.get("customerName")?.toString().trim();
  const rating = parseInt(formData.get("rating")?.toString() || "0");
  const reviewText = formData.get("reviewText")?.toString().trim();
  
  // Handle file uploads
  const mediaFiles = formData.getAll("mediaFiles");
  const mediaUrls = [];
  
  // For demo purposes, we'll use placeholder URLs since file upload requires more setup
  // In a real app, you'd save files to cloud storage (AWS S3, Cloudinary, etc.)
  for (const file of mediaFiles) {
    if (file && file.size > 0) {
      // For demo: use a placeholder URL that represents the uploaded file
      const placeholderUrl = `https://images.unsplash.com/photo-${Date.now() + Math.random()}?w=400&h=400&fit=crop&q=80`;
      mediaUrls.push(placeholderUrl);
    }
  }
  
  const mediaUrlsString = JSON.stringify(mediaUrls);
  
  // Basic validation
  const errors = {};
  
  if (!customerName) {
    errors.customerName = "Name is required";
  }
  
  if (!rating || rating < 1 || rating > 5) {
    errors.rating = "Please select a rating from 1 to 5 stars";
  }
  
  if (!reviewText || reviewText.length < 10) {
    errors.reviewText = "Review must be at least 10 characters long";
  }
  
  if (!productId) {
    errors.productId = "Product ID is required";
  }
  
  // Return errors if validation fails
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }
  
  try {
    // For this demo, use the shop from your development setup
    const shop = "tryongoeye.myshopify.com";
    
    // Check if this product belongs to a product group
    const productGroups = await prisma.productGroup.findMany({
      where: { shop: shop }
    });
    
    const productGroup = productGroups.find(group => {
      const productIds = JSON.parse(group.productIds || '[]');
      return productIds.includes(productId);
    });
    
    // Create the review with optional product group association
    await prisma.review.create({
      data: {
        shop: shop,
        productId: productId,
        customerName: customerName,
        rating: rating,
        reviewText: reviewText,
        mediaUrls: mediaUrlsString,
        approved: false, // Always start as pending
        productGroupId: productGroup ? productGroup.id : null
      }
    });
    
    return json({ 
      success: true, 
      message: "Thank you! Your review has been submitted and is pending approval." 
    });
    
  } catch (error) {
    console.error("Error creating review:", error);
    return json({ 
      errors: { general: "Something went wrong. Please try again." },
      success: false 
    }, { status: 500 });
  }
};

export const loader = async ({ params }) => {
  const productId = params.productId;
  
  return json({ 
    productId: productId,
    productTitle: `Product ${productId}` 
  });
};

export default function SubmitReview() {
  const { productId, productTitle } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [selectedRating, setSelectedRating] = useState(0);
  
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors || {};
  
  const StarRating = ({ rating, onRate, interactive = false }) => {
    return (
      <div style={{ display: 'flex', gap: '4px', fontSize: '24px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? '#ffd700' : '#ddd',
              cursor: interactive ? 'pointer' : 'default',
              userSelect: 'none'
            }}
            onClick={() => interactive && onRate(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  if (actionData?.success) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '50px auto', 
        padding: '30px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #e0f2fe'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ color: '#059669', marginBottom: '15px' }}>Review Submitted Successfully!</h2>
        <p style={{ color: '#374151', fontSize: '16px', lineHeight: '1.6' }}>
          {actionData.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Submit Another Review
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#1f2937', 
        marginBottom: '10px',
        fontSize: '28px'
      }}>
        Write a Review
      </h1>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#6b7280', 
        marginBottom: '30px',
        fontSize: '16px'
      }}>
        Share your experience with {productTitle}
      </p>
      
      {errors.general && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {errors.general}
        </div>
      )}
      
      <Form method="post" encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Customer Name */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            Your Name *
          </label>
          <input
            type="text"
            name="customerName"
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.customerName ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          {errors.customerName && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.customerName}
            </p>
          )}
        </div>
        
        {/* Rating */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            Rating *
          </label>
          <div style={{ marginBottom: '8px' }}>
            <StarRating 
              rating={selectedRating} 
              onRate={setSelectedRating} 
              interactive={true} 
            />
          </div>
          <input
            type="hidden"
            name="rating"
            value={selectedRating}
          />
          {errors.rating && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.rating}
            </p>
          )}
        </div>
        
        {/* Review Text */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            Your Review *
          </label>
          <textarea
            name="reviewText"
            placeholder="Tell us about your experience with this product..."
            rows={5}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${errors.reviewText ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          {errors.reviewText && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.reviewText}
            </p>
          )}
        </div>
        
        {/* Media Upload (optional) */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            Add Photos (Optional)
          </label>
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ marginBottom: '15px', fontSize: '48px' }}>📸</div>
            <input
              type="file"
              name="mediaFiles"
              multiple
              accept="image/*,video/*"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            />
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px', margin: '8px 0 0 0' }}>
              Upload photos or videos to showcase your experience<br />
              <small>Supports: JPG, PNG, GIF, MP4, MOV (Max 10MB each)</small>
            </p>
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '16px',
            backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '10px'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </Form>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#6b7280', 
        fontSize: '14px', 
        marginTop: '20px' 
      }}>
        Your review will be pending approval before it appears publicly.
      </p>
    </div>
  );
} 