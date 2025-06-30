# 🎯 **SOLUTION: Custom Theme Section** 

## ✅ **This Fixes the Duplicate Issue**

Instead of a complex app extension, we'll create a **custom theme section** that appears in your theme customizer and can be configured easily.

## 📁 **Step 1: Create the Section File**

1. Go to your Shopify admin: **Online Store** → **Themes** → **Actions** → **Edit code**
2. Navigate to **Sections** 
3. Click **"Add a new section"**
4. Name it: `product-reviews.liquid`
5. **Replace all content** with the code below:

## 💻 **Section Code to Copy**

```liquid
<div class="product-reviews-section" id="product-reviews-{{ section.id }}">
  <style>
    .product-reviews-section {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 100%;
      margin: {{ section.settings.margin_top }}px 0 {{ section.settings.margin_bottom }}px 0;
      padding: {{ section.settings.padding }}px;
      {% if section.settings.show_border %}
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      {% endif %}
      {% if section.settings.background_color != blank %}
      background-color: {{ section.settings.background_color }};
      {% endif %}
    }
    
    .reviews-title {
      font-size: {{ section.settings.title_size }}px;
      font-weight: 600;
      margin-bottom: 1rem;
      color: {% if section.settings.title_color != blank %}{{ section.settings.title_color }}{% else %}#1f2937{% endif %};
      text-align: {{ section.settings.title_alignment }};
    }
    
    .reviews-summary {
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      justify-content: {{ section.settings.title_alignment }};
    }
    
    .reviews-stars {
      color: {{ section.settings.star_color }};
      font-size: 1.2rem;
    }
    
    .reviews-loading, .reviews-empty {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    
    .review-item {
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 0;
    }
    
    .review-item:last-child {
      border-bottom: none;
    }
    
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .review-customer {
      font-weight: 600;
      color: #1f2937;
    }
    
    .review-date {
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .review-text {
      margin: 0.5rem 0;
      line-height: 1.6;
      color: #374151;
    }
    
    .write-review-btn {
      background: {{ section.settings.button_color }};
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
      margin-top: 1rem;
      font-weight: 500;
    }
    
    .write-review-btn:hover {
      background: {{ section.settings.button_hover_color }};
      text-decoration: none;
      color: white;
    }
    
    @media (max-width: 768px) {
      .product-reviews-section {
        padding: 1rem;
      }
      
      .review-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  </style>

  {% if section.settings.title != blank %}
    <h3 class="reviews-title">{{ section.settings.title }}</h3>
  {% endif %}
  
  {% if section.settings.show_summary %}
    <div class="reviews-summary">
      <div class="reviews-stars"></div>
      <span class="reviews-rating-text"></span>
    </div>
  {% endif %}
  
  <div id="reviews-content-{{ section.id }}">
    <div class="reviews-loading">Loading reviews...</div>
  </div>
  
  {% if section.settings.show_write_button %}
    <a href="https://04847e926845c853b6a67cd64caf0dc7.myshopifypreview.com/submit-review/{{ product.id }}" 
       class="write-review-btn" target="_blank">
      {{ section.settings.button_text }}
    </a>
  {% endif %}
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const sectionId = '{{ section.id }}';
  const productId = '{{ product.id }}';
  const reviewsLimit = {{ section.settings.reviews_limit }};
  const showSummary = {{ section.settings.show_summary | json }};
  
  const apiUrl = `https://04847e926845c853b6a67cd64caf0dc7.myshopifypreview.com/api/reviews?productId=${encodeURIComponent(productId)}&limit=${reviewsLimit}`;
  
  const content = document.getElementById(`reviews-content-${sectionId}`);
  const summary = document.querySelector(`#product-reviews-${sectionId} .reviews-summary`);
  
  // Only proceed if we have a product ID
  if (!productId || productId === '') {
    content.innerHTML = '<div class="reviews-empty">Product not found</div>';
    return;
  }
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.reviews && data.reviews.length > 0) {
        content.innerHTML = '';
        
        // Show summary if enabled
        if (showSummary && summary && data.summary && data.summary.totalReviews > 0) {
          const summaryStars = summary.querySelector('.reviews-stars');
          const summaryText = summary.querySelector('.reviews-rating-text');
          
          if (summaryStars && summaryText) {
            const rating = Math.round(data.summary.averageRating);
            summaryStars.innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            summaryText.textContent = `${data.summary.averageRating.toFixed(1)} (${data.summary.totalReviews} review${data.summary.totalReviews !== 1 ? 's' : ''})`;
            summary.style.display = 'flex';
          }
        }
        
        // Show reviews
        const reviewsHtml = data.reviews.map(review => {
          const date = new Date(review.createdAt).toLocaleDateString();
          const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
          
          return `
            <div class="review-item">
              <div class="review-header">
                <div class="review-customer">${review.customerName}</div>
                <div class="review-date">${date}</div>
              </div>
              <div class="reviews-stars">${stars}</div>
              <div class="review-text">${review.reviewText}</div>
            </div>
          `;
        }).join('');
        
        content.innerHTML = reviewsHtml;
      } else {
        content.innerHTML = `
          <div class="reviews-empty">
            No reviews yet. Be the first to review this product!
          </div>
        `;
      }
    })
    .catch(error => {
      console.error('Error loading reviews:', error);
      content.innerHTML = `
        <div class="reviews-empty">
          Unable to load reviews at this time.
        </div>
      `;
    });
});
</script>

{% schema %}
{
  "name": "Product Reviews",
  "settings": [
    {
      "type": "header",
      "content": "Content Settings"
    },
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Customer Reviews"
    },
    {
      "type": "checkbox",
      "id": "show_summary",
      "label": "Show Rating Summary",
      "default": true
    },
    {
      "type": "range",
      "id": "reviews_limit",
      "label": "Number of Reviews to Show",
      "min": 1,
      "max": 20,
      "step": 1,
      "default": 10
    },
    {
      "type": "checkbox",
      "id": "show_write_button",
      "label": "Show Write Review Button",
      "default": true
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Write a Review"
    },
    {
      "type": "header",
      "content": "Style Settings"
    },
    {
      "type": "select",
      "id": "title_alignment",
      "label": "Title Alignment",
      "options": [
        {"value": "left", "label": "Left"},
        {"value": "center", "label": "Center"},
        {"value": "right", "label": "Right"}
      ],
      "default": "left"
    },
    {
      "type": "range",
      "id": "title_size",
      "label": "Title Font Size",
      "min": 14,
      "max": 32,
      "step": 2,
      "default": 24,
      "unit": "px"
    },
    {
      "type": "color",
      "id": "title_color",
      "label": "Title Color",
      "default": "#1f2937"
    },
    {
      "type": "color",
      "id": "star_color",
      "label": "Star Color",
      "default": "#ffd700"
    },
    {
      "type": "color",
      "id": "button_color",
      "label": "Button Color",
      "default": "#10b981"
    },
    {
      "type": "color",
      "id": "button_hover_color",
      "label": "Button Hover Color",
      "default": "#059669"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color"
    },
    {
      "type": "checkbox",
      "id": "show_border",
      "label": "Show Border",
      "default": true
    },
    {
      "type": "header",
      "content": "Spacing"
    },
    {
      "type": "range",
      "id": "margin_top",
      "label": "Top Margin",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "unit": "px"
    },
    {
      "type": "range",
      "id": "margin_bottom",
      "label": "Bottom Margin",
      "min": 0,
      "max": 100,
      "step": 5,
      "default": 30,
      "unit": "px"
    },
    {
      "type": "range",
      "id": "padding",
      "label": "Internal Padding",
      "min": 0,
      "max": 50,
      "step": 5,
      "default": 20,
      "unit": "px"
    }
  ],
  "presets": [
    {
      "name": "Product Reviews"
    }
  ]
}
{% endschema %}
```

## 🎯 **Step 2: Add Section to Product Template**

### **Option A: Theme Customizer (Recommended)**
1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to a **Product page**
3. Click **"Add section"** 
4. Look for **"Product Reviews"** in the list
5. Click to add it
6. **Position it** below the product description
7. **Configure settings** (title, colors, spacing, etc.)
8. Click **Save**

### **Option B: Code Method**
1. Edit **Templates** → **product.liquid**
2. Add this line where you want reviews: `{% section 'product-reviews' %}`
3. Save

## 🎨 **Customization Options**

The section includes these settings:
- ✏️ **Custom title text**
- 🎨 **Colors** (title, stars, button, background)
- 📐 **Spacing** (margins, padding)
- 🔢 **Review limit** (1-20 reviews)
- 👁️ **Toggle** summary, border, write button
- 📱 **Responsive design**

## ✅ **Benefits of This Method**

- ❌ **No duplicate apps** in theme customizer
- 🎛️ **Full customization** through GUI
- 📱 **Mobile responsive**
- 🎨 **Matches your theme** colors
- 💾 **Easy to remove** if needed
- ⚡ **No extension conflicts**

## 🚀 **Test It**

After adding the section:
1. Visit any product page
2. You should see the review widget with your existing 3 reviews
3. Test the "Write a Review" button
4. Try customizing colors/settings in the theme editor

This approach is **much cleaner** than app extensions and gives you **full control**! 