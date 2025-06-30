const fs = require('fs');

// Get port from command line argument
const newPort = process.argv[2];

if (!newPort) {
  console.log('❌ Please provide a port number');
  console.log('Usage: node update-widgets.js <port>');
  console.log('Example: node update-widgets.js 53850');
  process.exit(1);
}

console.log(`🔄 Updating all widgets to use port ${newPort}...\n`);

const filesToUpdate = [
  'SHOPIFY-STORE-WIDGET-UPDATED.liquid',
  'sections/product-reviews.liquid',
  'FINAL-WORKING-SECTION-CODE.liquid',
  'shopify-theme-widget.liquid',
  'public/demo-grouped-reviews.html',
  'LOOX-STYLE-SECTION.liquid'
];

let updatedFiles = 0;
let failedFiles = 0;

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Count current localhost references
      const currentMatches = content.match(/localhost:\d+/g) || [];
      
      // Replace localhost:PORT with new port
      content = content.replace(/localhost:\d+/g, `localhost:${newPort}`);
      
      // Update port comments
      content = content.replace(/port \d+/gi, `port ${newPort}`);
      content = content.replace(/server is now on \d+/gi, `server is now on ${newPort}`);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath} - Updated ${currentMatches.length} port references`);
      updatedFiles++;
    } catch (error) {
      console.log(`❌ ${filePath} - Failed: ${error.message}`);
      failedFiles++;
    }
  } else {
    console.log(`⚠️ ${filePath} - File not found`);
  }
});

// Update current-port.json
const portInfo = {
  currentPort: newPort,
  lastUpdated: new Date().toISOString(),
  updatedFiles: updatedFiles,
  method: 'manual-update'
};

fs.writeFileSync('current-port.json', JSON.stringify(portInfo, null, 2));

console.log(`\n📊 Update Summary:`);
console.log(`   ✅ Files Updated: ${updatedFiles}`);
console.log(`   ❌ Files Failed: ${failedFiles}`);
console.log(`   📝 Port Info: current-port.json updated`);

console.log(`\n🌐 Your new URLs:`);
console.log(`   Admin: http://localhost:${newPort}/app/reviews`);
console.log(`   Submit: http://localhost:${newPort}/submit-review/9038857732326`);
console.log(`   API: http://localhost:${newPort}/api/reviews?productId=9038857732326`);

console.log(`\n💡 Next Steps:`);
console.log(`   1. Copy SHOPIFY-STORE-WIDGET-UPDATED.liquid to your Shopify store`);
console.log(`   2. Save and refresh your product page`);
console.log(`   3. Check console for: "✅ SUCCESS with: http://localhost:${newPort}"`);

console.log(`\n🎉 All widgets updated to port ${newPort}!`); 