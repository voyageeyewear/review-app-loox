# 🚀 Vercel Deployment Guide

This guide will help you deploy your Review App to Vercel and solve the port issues forever!

## 📋 Pre-Deployment Checklist

### ✅ What's Already Done:
- App code is complete
- Database schema updated for PostgreSQL
- Vercel.json configuration exists
- Package.json build scripts ready

### 🔧 What You Need:

#### 1. **Vercel Account**
- Sign up at: https://vercel.com
- Connect your GitHub repository

#### 2. **Production Database (Choose One):**

**Option A: Vercel Postgres (Recommended)**
```bash
# Free tier: 60MB storage, 1000 monthly queries
# Perfect for testing and small stores
```

**Option B: Supabase (Alternative)**
```bash
# Free tier: 500MB storage, 2GB bandwidth
# More generous limits
```

#### 3. **Environment Variables for Vercel:**

```bash
# Copy these to Vercel Dashboard > Settings > Environment Variables

# Shopify Configuration
SHOPIFY_API_KEY=04847e926845c853b6a67cd64caf0dc7
SHOPIFY_API_SECRET=your_shopify_api_secret_from_partner_dashboard
SHOPIFY_SCOPES=write_products,read_orders,write_orders,read_customers

# Database (Will be provided by Vercel Postgres)
DATABASE_URL=postgresql://username:password@host:port/database

# Email & WhatsApp
KLAVIYO_API_KEY=pk_a0ac9d2821d12915f87b72670dcf1096c1
INTERAKT_API_KEY=bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo=

# Production Settings
NODE_ENV=production
SESSION_SECRET=your_random_32_character_string_here
```

## 🚀 Deployment Steps

### Step 1: Database Setup
1. Go to Vercel Dashboard
2. Add "Vercel Postgres" to your project
3. Copy the `DATABASE_URL` from Postgres dashboard
4. Add to Environment Variables

### Step 2: Deploy to Vercel
```bash
# Option A: Connect GitHub (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy automatically

# Option B: Vercel CLI
npm i -g vercel
vercel --prod
```

### Step 3: Database Migration
```bash
# After deployment, run once:
npx prisma migrate deploy
npx prisma generate
```

### Step 4: Update Widget URLs
Once deployed, your production URL will be:
```
https://review-app-loox.vercel.app
```

**Replace in ALL widgets:**
```javascript
// OLD (Development)
http://localhost:54223/api/reviews

// NEW (Production) 
https://review-app-loox.vercel.app/api/reviews
```

## 🎯 Post-Deployment Testing

### Test Your APIs:
```bash
# Reviews API
curl "https://review-app-loox.vercel.app/api/reviews?productId=9038857732326&limit=5"

# Submit Review Page
https://review-app-loox.vercel.app/submit-review/9038857732326

# Admin Dashboard
https://review-app-loox.vercel.app/app/reviews
```

## 🔧 Troubleshooting

### Common Issues:

**Database Connection Error:**
- Check DATABASE_URL in environment variables
- Ensure Vercel Postgres is properly connected

**Shopify Authentication Error:**  
- Verify SHOPIFY_API_SECRET is correct
- Check app URLs in Shopify Partner Dashboard

**CORS Errors:**
- Add your production domain to Shopify app settings
- Update webhook URLs to production

## ✅ Success Checklist

- [ ] App deploys without errors
- [ ] Database connects successfully  
- [ ] Reviews API responds correctly
- [ ] Admin dashboard loads
- [ ] Email notifications work
- [ ] WhatsApp notifications work
- [ ] Review submission works
- [ ] Widgets load on Shopify store

## 🎉 Final Result

**Your app will have:**
- Fixed URL: `https://review-app-loox.vercel.app`
- No more port changes
- Professional production setup
- Ready for Shopify App Store (optional)

**Port Problem = SOLVED FOREVER! 🎯** 