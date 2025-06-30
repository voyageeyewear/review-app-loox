import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Shopify Dev Server Port Detector\n');

try {
  // Method 1: Check if we have saved port info
  if (fs.existsSync('current-port.json')) {
    const portInfo = JSON.parse(fs.readFileSync('current-port.json', 'utf8'));
    console.log('📂 Saved Port Info:');
    console.log(`   Port: ${portInfo.currentPort}`);
    console.log(`   Last Updated: ${portInfo.lastUpdated}`);
    console.log(`   Files Updated: ${portInfo.updatedFiles}\n`);
    
    // Test if this port is still active
    try {
      execSync(`curl -s -m 2 "http://localhost:${portInfo.currentPort}/api/reviews?productId=test"`, { stdio: 'pipe' });
      console.log(`✅ Server is ACTIVE on port ${portInfo.currentPort}`);
      console.log(`🌐 Quick Links:`);
      console.log(`   Admin: http://localhost:${portInfo.currentPort}/app/reviews`);
      console.log(`   Submit: http://localhost:${portInfo.currentPort}/submit-review/9038857732326`);
      console.log(`   API: http://localhost:${portInfo.currentPort}/api/reviews?productId=9038857732326`);
      process.exit(0);
    } catch {
      console.log(`❌ Saved port ${portInfo.currentPort} is not responding`);
    }
  }
  
  // Method 2: Scan for active Shopify server
  console.log('🔍 Scanning for active Shopify server...');
  
  const result = execSync('lsof -ti tcp | xargs -I {} lsof -p {} | grep LISTEN | grep node', { 
    encoding: 'utf8', 
    stdio: 'pipe' 
  });
  
  const lines = result.split('\n');
  const foundPorts = [];
  
  for (const line of lines) {
    const match = line.match(/:(\d+).*LISTEN/);
    if (match) {
      const port = match[1];
      
      try {
        // Test if it's our API server
        execSync(`curl -s -m 2 "http://localhost:${port}/api/reviews?productId=test"`, { 
          stdio: 'pipe',
          timeout: 3000 
        });
        foundPorts.push(port);
      } catch {
        // Not our server
      }
    }
  }
  
  if (foundPorts.length > 0) {
    const activePort = foundPorts[0];
    console.log(`✅ Found active Shopify server on port ${activePort}`);
    
    // Test API and get info
    try {
      const apiResponse = execSync(`curl -s "http://localhost:${activePort}/api/reviews?productId=9038857732326&limit=1"`, { 
        encoding: 'utf8' 
      });
      
      const apiData = JSON.parse(apiResponse);
      if (apiData.success) {
        console.log(`📊 API Status: ${apiData.summary.totalReviews} reviews, ${apiData.summary.averageRating.toFixed(1)}⭐ avg`);
      }
    } catch {
      console.log('📊 API Status: Running but could not get review data');
    }
    
    console.log(`\n🌐 Quick Links:`);
    console.log(`   Admin: http://localhost:${activePort}/app/reviews`);
    console.log(`   Submit: http://localhost:${activePort}/submit-review/9038857732326`);
    console.log(`   API: http://localhost:${activePort}/api/reviews?productId=9038857732326`);
    
    console.log(`\n🔧 Update Commands:`);
    console.log(`   Update widgets: node update-widgets.js ${activePort}`);
    console.log(`   Save port info: echo '{"currentPort":"${activePort}","lastUpdated":"${new Date().toISOString()}"}' > current-port.json`);
    
  } else {
    console.log('❌ No active Shopify server found');
    console.log('\n💡 To start the server:');
    console.log('   npm run dev          (Auto port management)');
    console.log('   npm run dev-manual   (Manual mode)');
  }
  
} catch (error) {
  console.log('❌ Error detecting port:', error.message);
  console.log('\n💡 Make sure your Shopify dev server is running:');
  console.log('   npm run dev');
} 