# 🔧 Review Widget Installation Guide

## Method 1: Quick Install (Recommended)

### Step 1: Edit Product Template
1. Go to **Online Store** → **Themes** → **Actions** → **Edit code**
2. Navigate to **Templates** → **product.liquid**
3. Find where you want reviews to appear (usually after product description)
4. Paste the widget code below

### Step 2: Widget Code to Copy
```liquid
<!-- Review Widget - Place in product.liquid template -->
<div id="product-reviews-widget-{{ product.id }}">
    <style>
        #product-reviews-widget-{{ product.id }} {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 2rem 0;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
        }
        
        .reviews-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #1f2937;
        }
        
        .reviews-summary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .reviews-stars {
            color: #ffd700;
            font-size: 1.2rem;
        }
        
        .reviews-loading {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 6px;
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
            background: #10b981;
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
            background: #059669;
            text-decoration: none;
            color: white;
        }
        
        .reviews-empty {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
    </style>

    <h3 class="reviews-title">Customer Reviews</h3>
    
    <div class="reviews-summary" style="display: none;">
        <div class="reviews-stars"></div>
        <span class="reviews-rating-text"></span>
    </div>
    
    <div id="reviews-content-{{ product.id }}">
        <div class="reviews-loading">Loading reviews...</div>
    </div>
    
    <a href="https://04847e926845c853b6a67cd64caf0dc7.myshopifypreview.com/submit-review/{{ product.id }}" 
       class="write-review-btn" target="_blank">
        Write a Review
    </a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const productId = '{{ product.id }}';
    const apiUrl = `https://04847e926845c853b6a67cd64caf0dc7.myshopifypreview.com/api/reviews?productId=${encodeURIComponent(productId)}&limit=10`;
    
    const content = document.getElementById('reviews-content-{{ product.id }}');
    const summary = document.querySelector('#product-reviews-widget-{{ product.id }} .reviews-summary');
    
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
                
                // Show summary
                if (data.summary && data.summary.totalReviews > 0) {
                    const summaryStars = summary.querySelector('.reviews-stars');
                    const summaryText = summary.querySelector('.reviews-rating-text');
                    
                    const rating = Math.round(data.summary.averageRating);
                    summaryStars.innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                    summaryText.textContent = `${data.summary.averageRating.toFixed(1)} (${data.summary.totalReviews} review${data.summary.totalReviews !== 1 ? 's' : ''})`;
                    summary.style.display = 'flex';
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
```

### Step 3: Save and Test
1. Click **Save** in the theme editor
2. Visit any product page on your store
3. You should see the review widget appear

---

## Method 2: Section-Based Install (Advanced)

### Step 1: Create Review Section
1. Go to **Sections** → **Add a new section**
2. Name it `product-reviews.liquid`
3. Paste the section code below

### Step 2: Section Code
```liquid
{{ 'product-reviews.css' | asset_url | stylesheet_tag }}

<div class="product-reviews-section">
  <div id="product-reviews-widget-{{ product.id }}">
    <!-- Same HTML structure as Method 1 -->
  </div>
</div>

<script src="{{ 'product-reviews.js' | asset_url }}"></script>

{% schema %}
{
  "name": "Product Reviews",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_reviews",
      "label": "Show Reviews",
      "default": true
    }
  ]
}
{% endschema %}
```

### Step 3: Add to Product Template
1. Edit `product.liquid`
2. Add: `{% section 'product-reviews' %}`
3. Save

---

## Method 3: Snippet-Based Install (Cleanest)

### Step 1: Create Snippet
1. Go to **Snippets** → **Add a new snippet**
2. Name it `review-widget.liquid`
3. Paste the widget code

### Step 2: Include in Product Template
1. Edit `product.liquid`
2. Add: `{% include 'review-widget' %}`
3. Save

---

## 🔧 Troubleshooting

### Reviews Not Showing?
1. Check browser console for errors
2. Verify product ID is correct
3. Test API directly: `https://04847e926845c853b6a67cd64caf0dc7.myshopifypreview.com/api/reviews?productId=YOUR_PRODUCT_ID`

### Duplicate Widgets?
1. Search your theme for `product-reviews-widget`
2. Remove old/duplicate code
3. Keep only ONE widget instance per product page

### Styling Issues?
1. Check for CSS conflicts in your theme
2. Add `!important` to critical styles if needed
3. Test in different browsers

---

## 📱 Testing Checklist

- [ ] Widget appears on product pages
- [ ] Reviews load correctly
- [ ] "Write Review" button works
- [ ] Star ratings display properly
- [ ] Mobile responsive design
- [ ] No JavaScript errors in console

---

## 🎯 Quick Test URLs

- **Your Product:** https://tryongoeye.myshopify.com/products/YOUR_PRODUCT_HANDLE
- **Admin Reviews:** http://localhost:54471/app/reviews
- **Submit Review:** http://localhost:54471/submit-review/9038857732326
- **API Test:** http://localhost:54471/api/reviews?productId=9038857732326 