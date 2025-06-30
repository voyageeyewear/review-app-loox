const https = require('https');

async function testKlaviyoFixed() {
  try {
    console.log('🧪 Testing Klaviyo API with fixed structure...');
    
    // Fixed payload structure - profile needs to be a separate data object
    const payload = JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: 'atul@voyageeyewear.in',
                first_name: 'Atul',
                last_name: 'Gupta'
              }
            }
          },
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'Review Request'
              }
            }
          },
          properties: {
            order_number: 'ORD-382937',
            product_name: 'iPhone 15 Black',
            review_link: 'https://workout-listing-pottery-anybody.trycloudflare.com/submit-review/9038857732327?order=ORD-382937&customer=Atul%20Gupta',
            customer_name: 'Atul Gupta'
          }
        }
      }
    });
    
    const options = {
      hostname: 'a.klaviyo.com',
      port: 443,
      path: '/api/events/',
      method: 'POST',
      headers: {
        'Authorization': 'Klaviyo-API-Key pk_a0ac9d2821d12915f87b72670dcf1096c1',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'revision': '2023-12-15'
      }
    };
    
    console.log('📤 Sending payload:', JSON.stringify(JSON.parse(payload), null, 2));
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\n📊 Response:');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        
        if (res.statusCode < 300) {
          console.log('\n✅ Klaviyo email sent successfully!');
          console.log('📧 Email sent to: atul@voyageeyewear.in');
        } else {
          console.log('\n❌ Klaviyo email failed');
          try {
            const errorData = JSON.parse(body);
            console.log('Error details:', errorData.errors?.[0]?.detail || 'Unknown error');
          } catch (e) {
            console.log('Raw error:', body);
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    req.write(payload);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testKlaviyoFixed(); 