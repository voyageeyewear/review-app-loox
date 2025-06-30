# 🚀 Auto Port Management System

## Overview

This system automatically handles port changes for your Shopify review app development server, eliminating the need to manually update widget files every time the server restarts on a different port.

## 🛠️ Available Scripts

### 1. Auto Development (Recommended)
```bash
npm run dev
```
- **What it does:** Automatically kills old processes, starts Shopify dev server, detects the new port, and updates all widget files
- **Output:** Real-time port detection and file updates
- **Best for:** Daily development work

### 2. Manual Development
```bash
npm run dev-manual
```
- **What it does:** Runs standard `shopify app dev` without port management
- **Best for:** When you want full control or debugging issues

### 3. Clean Restart
```bash
npm run dev-clean
```
- **What it does:** Forcefully kills existing processes, then runs auto dev
- **Best for:** When processes are stuck or not responding

### 4. Port Status Check
```bash
npm run port-status
```
- **What it does:** Shows current port information and server status
- **Output:** Port number, last update time, files updated

## 🔧 Utility Scripts

### Port Detection
```bash
node detect-port.js
```
- Scans for active Shopify server
- Shows API status and review count
- Provides quick links to admin, submit form, and API

### Manual Widget Update
```bash
node update-widgets.js <port>
```
- Updates all widget files to use a specific port
- Example: `node update-widgets.js 53850`
- Updates port tracking file

## 📁 Files That Get Auto-Updated

1. `SHOPIFY-STORE-WIDGET-UPDATED.liquid`
2. `sections/product-reviews.liquid`
3. `FINAL-WORKING-SECTION-CODE.liquid`
4. `shopify-theme-widget.liquid`
5. `public/demo-grouped-reviews.html`

## 🧠 Smart Widget (Ultimate Solution)

### `SMART-AUTO-WIDGET.liquid`

This is the **ultimate widget** that requires **zero manual updates**:

**Features:**
- ✅ Automatically detects server port
- ✅ Remembers last working port (localStorage)
- ✅ Tests multiple common ports (53850, 49327, 55848, etc.)
- ✅ Visual connection status indicator
- ✅ Fallback retry mechanism
- ✅ Works with product grouping
- ✅ Beautiful UI with images and ratings

**How to use:**
1. Copy `SMART-AUTO-WIDGET.liquid` content
2. Paste into your Shopify theme section
3. **Never update ports again!** The widget handles everything automatically

## 🔄 How It Works

### Port Detection Algorithm
1. Check localStorage for last working port
2. Test last working port first (fastest)
3. Scan common development ports
4. Test API connectivity for each port
5. Save working port for next time
6. Retry with different timeouts if needed

### Files Updated
- All `localhost:PORT` references updated
- Port comments updated  
- Server status comments updated
- `current-port.json` tracking file created

## 🎯 Quick Start Guide

### For New Setup:
```bash
# 1. Start auto development
npm run dev

# 2. Copy SMART-AUTO-WIDGET.liquid to your Shopify store
# 3. Never worry about ports again!
```

### For Existing Setup:
```bash
# 1. Check current status
npm run port-status

# 2. If server not running, start it
npm run dev

# 3. Update existing widgets (optional - Smart Widget is better)
node update-widgets.js $(cat current-port.json | grep -o '"currentPort":"[^"]*"' | cut -d'"' -f4)
```

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Kill all processes and try again
npm run dev-clean
```

### Can't Detect Port
```bash
# Manual detection
node detect-port.js

# Manual update
node update-widgets.js 53850  # Replace with actual port
```

### Widget Not Connecting
1. Check console for port detection messages
2. Verify server is running: `npm run port-status`
3. Use Smart Widget for automatic handling
4. Clear browser cache if using old widget

### Port Keeps Changing
This is normal with Shopify CLI. The auto system handles this automatically:
- Use `npm run dev` (not `npm run dev-manual`)
- Use `SMART-AUTO-WIDGET.liquid` for zero-maintenance

## 📊 Port Tracking

### `current-port.json`
Automatically created file that tracks:
```json
{
  "currentPort": "53850",
  "lastUpdated": "2025-01-26T18:30:00.000Z",
  "updatedFiles": 5,
  "method": "auto-detection"
}
```

### localStorage (Smart Widget)
- `reviewServerPort`: Last working port
- `reviewServerLastSeen`: When it was last detected

## 🎉 Benefits

1. **Zero Manual Updates:** Set it up once, works forever
2. **Instant Connectivity:** Smart detection connects in seconds
3. **Failsafe Fallbacks:** Multiple detection methods and retries
4. **Visual Feedback:** See connection status in real-time
5. **Memory Optimization:** Remembers working ports
6. **Cross-Browser:** Works in all modern browsers

## 🔮 Future Enhancements

- WebSocket connection for real-time port updates
- Development server health monitoring
- Automatic theme file updates via Shopify CLI
- Port preference learning algorithm

---

**💡 Pro Tip:** Use the `SMART-AUTO-WIDGET.liquid` for the best experience. It handles everything automatically and provides the best user experience with visual connection status and smart port detection! 