# 📥📤 Import/Export Reviews Guide

Complete guide for importing and exporting reviews in your Shopify Review App.

## 🎯 **Overview**

The Import/Export feature allows you to:
- **Import** bulk reviews from CSV files
- **Export** existing reviews for backup or analysis
- **Migrate** reviews from other platforms
- **Manage** large datasets efficiently

---

## 📥 **Importing Reviews**

### **Required CSV Columns**
```csv
productId,customerName,rating
```

### **Optional CSV Columns**
```csv
reviewText,mediaUrls,approved,createdAt
```

### **Complete CSV Example**
```csv
productId,customerName,rating,reviewText,mediaUrls,approved,createdAt
9038857732326,"John Smith",5,"Amazing product! Love it.","",true,2025-06-29T10:00:00Z
9038857732327,"Sarah Johnson",4,"Good value for money.","",true,2025-06-28T15:30:00Z
```

### **Field Specifications**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `productId` | String/Number | ✅ Yes | Shopify product ID | `9038857732326` |
| `customerName` | String | ✅ Yes | Customer's full name | `"John Smith"` |
| `rating` | Number | ✅ Yes | Star rating (1-5) | `5` |
| `reviewText` | String | ❌ No | Review content | `"Amazing product!"` |
| `mediaUrls` | String | ❌ No | Image/video URLs | `"https://example.com/img.jpg"` |
| `approved` | Boolean | ❌ No | Approval status | `true` or `false` |
| `createdAt` | ISO Date | ❌ No | Review date | `2025-06-29T10:00:00Z` |

### **CSV Formatting Rules**

1. **Headers Required**: First row must contain column names
2. **Quote Text with Commas**: `"Great product, love it!"`
3. **Empty Cells**: Leave blank (no spaces)
4. **Boolean Values**: Use `true`/`false` or `1`/`0`
5. **Dates**: ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)

### **Import Process**

1. Navigate to **📥📤 Import/Export** in the admin menu
2. Paste CSV content or click **📝 Use Sample Data**
3. Click **📥 Download Sample CSV** for reference
4. Click **📥 Import Reviews**
5. Check success message and error details

---

## 📤 **Exporting Reviews**

### **Export Options**
- **All Reviews**: Export complete review database
- **Filtered by Status**: Approved/Pending reviews
- **Date Range**: Export reviews from specific period

### **Export Format**
The exported CSV includes all fields:
```csv
productId,customerName,rating,reviewText,mediaUrls,approved,createdAt
```

### **Export Process**

1. Go to **📥📤 Import/Export** page
2. Configure export options (optional)
3. Click **📤 Export Reviews**
4. Download the generated CSV file

---

## 🔧 **Advanced Usage**

### **Bulk Import from Other Platforms**

**From Shopify Product Reviews:**
1. Export reviews from Shopify admin
2. Map columns to our format
3. Import using our CSV format

**From Third-party Apps:**
1. Export from current review app
2. Transform data to match our schema
3. Import via CSV

### **Data Migration Checklist**

- [ ] **Backup** existing reviews before import
- [ ] **Validate** CSV format with sample data
- [ ] **Test** import with small batch first
- [ ] **Verify** imported reviews in admin
- [ ] **Check** approval status and ratings

### **Troubleshooting**

| Error | Solution |
|-------|----------|
| "Missing required fields" | Ensure productId, customerName, rating are present |
| "Invalid rating" | Rating must be 1-5 numeric value |
| "Date format error" | Use ISO 8601: `2025-06-29T10:00:00Z` |
| "CSV parsing failed" | Check for unescaped quotes and commas |

---

## 📊 **Statistics Dashboard**

The import/export page shows:
- **Total Reviews**: Complete review count
- **Approved Reviews**: Published reviews
- **Pending Reviews**: Reviews awaiting approval
- **Recent Reviews**: Latest 5 reviews preview

---

## 🎯 **Best Practices**

### **For Importing**
1. **Start Small**: Test with 5-10 reviews first
2. **Validate Data**: Check product IDs exist in Shopify
3. **Review Content**: Ensure reviews are appropriate
4. **Batch Processing**: Import in chunks of 100-500 reviews

### **For Exporting**
1. **Regular Backups**: Export monthly for backup
2. **Analytics**: Export for data analysis
3. **Migration**: Use exports for platform migration
4. **Reporting**: Generate customer feedback reports

---

## 🚀 **Integration with Email Automation**

Imported reviews work seamlessly with:
- ✅ **Email Automation** (Days, Hours, Seconds timing)
- ✅ **Product Groups** integration
- ✅ **Review display widgets**
- ✅ **Analytics and reporting**

---

## 📝 **Sample Files Available**

1. **sample-reviews-import.csv** - Complete sample with 15 reviews
2. **Use Sample Data** button - Quick 3-review test data
3. **Download Sample CSV** - Reference format file

---

## 💡 **Pro Tips**

- **Product IDs**: Use actual Shopify product IDs for best results
- **Customer Names**: Real names improve authenticity
- **Review Quality**: Import only genuine, helpful reviews
- **Approval Status**: Set `approved=false` for moderation workflow
- **Timing**: Import during low-traffic periods

---

**🎉 Your Import/Export feature is ready!**  
Navigate to **📥📤 Import/Export** in your admin menu to get started. 