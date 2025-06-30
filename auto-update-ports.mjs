import fs from 'fs';
import { execSync, spawn } from 'child_process';

console.log('🔄 Auto Port Management Starting...');

// Function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Step 1: Kill existing processes
console.log('1️⃣ Killing existing Shopify processes...');
try {
  execSync('pkill -f "shopify app dev"', { stdio: 'ignore' });
  execSync('pkill -f "cloudflared"', { stdio: 'ignore' });
  console.log('   ✅ Old processes killed');
} catch (error) {
  console.log('   ℹ️ No existing processes to kill');
}

// Step 2: Wait for cleanup
console.log('2️⃣ Waiting for cleanup...');
await sleep(2000);

// Step 3: Start Shopify dev server
console.log('3️⃣ Starting Shopify dev server...');
const shopifyProcess = spawn('shopify', ['app', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  detached: false
});

// Step 4: Function to detect port
async function detectPort() {
  console.log('4️⃣ Detecting server port...');
  
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      // Look for listening ports
      const result = execSync('lsof -ti tcp | xargs -I {} lsof -p {} | grep LISTEN | grep node', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      const lines = result.split('\n');
      for (const line of lines) {
        const match = line.match(/:(\d+).*LISTEN/);
        if (match) {
          const port = match[1];
          
          // Test if it's our API server with a real product ID
          try {
            const testResponse = execSync(`curl -s -m 2 "http://localhost:${port}/api/reviews?productId=9055806980326&limit=1"`, { 
              stdio: 'pipe',
              timeout: 3000 
            });
            
            // Check if response contains API structure and is not 404
            if (testResponse.includes('"success":true') && testResponse.includes('reviews')) {
              console.log(`   ✅ API Server detected on port: ${port} (verified with real data)`);
              return port;
            }
          } catch {
            // Not our API server, continue
          }
          
          // Also test for general API endpoint
          try {
            const generalTest = execSync(`curl -s -m 2 "http://localhost:${port}/ping"`, { 
              stdio: 'pipe',
              timeout: 3000 
            });
            
            if (generalTest.includes('pong') || generalTest.includes('ok')) {
              console.log(`   ✅ General server detected on port: ${port}`);
              return port;
            }
          } catch {
            // Not our server, continue
          }
        }
      }
    } catch {
      // Continue trying
    }
    
    console.log(`   🔍 Attempt ${attempt}/30 - Still looking for server...`);
    await sleep(1000);
  }
  
  return null;
}

// Step 5: Main execution
(async () => {
  const port = await detectPort();
  
  if (!port) {
    console.log('❌ Could not detect server port after 30 seconds');
    console.log('   Please check if the server started correctly');
    process.exit(1);
  }
  
  // Step 6: Update all widget files
  console.log('5️⃣ Updating widget files...');
  
  const filesToUpdate = [
    'SHOPIFY-STORE-WIDGET-UPDATED.liquid',
    'sections/product-reviews.liquid',
    'FINAL-WORKING-SECTION-CODE.liquid',
    'shopify-theme-widget.liquid',
    'public/demo-grouped-reviews.html'
  ];
  
  let updatedFiles = 0;
  
  filesToUpdate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace localhost:PORT with new port
        content = content.replace(/localhost:\d+/g, `localhost:${port}`);
        
        // Update port comments
        content = content.replace(/port \d+/gi, `port ${port}`);
        content = content.replace(/server is now on \d+/gi, `server is now on ${port}`);
        
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Updated: ${filePath}`);
        updatedFiles++;
      } catch (error) {
        console.log(`   ❌ Failed to update: ${filePath}`);
      }
    }
  });
  
  // Step 7: Save port info
  const portInfo = {
    currentPort: port,
    lastUpdated: new Date().toISOString(),
    updatedFiles: updatedFiles
  };
  
  fs.writeFileSync('current-port.json', JSON.stringify(portInfo, null, 2));
  
  // Step 8: Test API
  console.log('6️⃣ Testing API...');
  try {
    const testResult = execSync(`curl -s "http://localhost:${port}/api/reviews?productId=9038857732326&limit=1"`, { 
      encoding: 'utf8' 
    });
    
    const apiData = JSON.parse(testResult);
    if (apiData.success) {
      console.log(`   ✅ API working! ${apiData.summary.totalReviews} reviews found`);
    }
  } catch (error) {
    console.log(`   ⚠️ API test failed: ${error.message}`);
  }
  
  // Success summary
  console.log('\n🎉 Auto Port Management Complete!');
  console.log(`📋 Summary:`);
  console.log(`   • Server Port: ${port}`);
  console.log(`   • Files Updated: ${updatedFiles}`);
  console.log(`   • Admin: http://localhost:${port}/app/reviews`);
  console.log(`   • Submit: http://localhost:${port}/submit-review/9038857732326`);
  console.log(`   • API: http://localhost:${port}/api/reviews?productId=9038857732326`);
  console.log('\n🏃 Server running... Press Ctrl+C to stop');
})();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  if (shopifyProcess) {
    shopifyProcess.kill();
  }
  process.exit(0);
});

// Forward shopify output
shopifyProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

shopifyProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

shopifyProcess.on('close', (code) => {
  console.log(`\n📱 Shopify process exited with code ${code}`);
  process.exit(code);
}); 