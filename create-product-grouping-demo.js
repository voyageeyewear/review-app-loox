const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createProductGroupingDemo() {
  try {
    console.log('🚀 Setting up Product Grouping Demo...');
    
    // Clear existing data for clean start
    await prisma.review.deleteMany({});
    await prisma.productGroup.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create iPhone 15 Product Group
    const iphoneGroup = await prisma.productGroup.create({
      data: {
        shop: 'tryongoeye.myshopify.com',
        name: 'iPhone 15 Collection',
        description: 'Complete iPhone 15 lineup with different colors and storage options',
        productIds: JSON.stringify([
          '9038857732326',  // Original product (Blue 128GB)
          '9038857732327',  // Black 128GB 
          '9038857732328',  // Pink 256GB
          '9038857732329',  // Green 512GB
          '9038857732330'   // Natural Titanium 1TB
        ])
      }
    });
    
    console.log(`📱 Created iPhone 15 Collection group (${iphoneGroup.id})`);
    
    // Create MacBook Pro Product Group  
    const macbookGroup = await prisma.productGroup.create({
      data: {
        shop: 'tryongoeye.myshopify.com',
        name: 'MacBook Pro 2024',
        description: 'Latest MacBook Pro models with M3 chip in different screen sizes',
        productIds: JSON.stringify([
          '9038857732340',  // 14-inch Silver
          '9038857732341',  // 14-inch Space Gray
          '9038857732342',  // 16-inch Silver
          '9038857732343'   // 16-inch Space Gray
        ])
      }
    });
    
    console.log(`💻 Created MacBook Pro 2024 group (${macbookGroup.id})`);
    
    // iPhone 15 Reviews with realistic images
    const iphoneReviews = [
      {
        productId: '9038857732326', // Blue 128GB (your original product)
        customerName: 'Sarah Williams',
        rating: 5,
        reviewText: 'Absolutely love this iPhone 15 in blue! The camera quality is incredible and the design feels so premium. The Dynamic Island is a game-changer.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      },
      {
        productId: '9038857732326', // Blue 128GB
        customerName: 'Mike Chen',
        rating: 4,
        reviewText: 'Great phone overall! Battery life is solid and the performance is smooth. The blue color is beautiful in person.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      },
      {
        productId: '9038857732327', // Black 128GB
        customerName: 'Emily Rodriguez',
        rating: 5,
        reviewText: 'The black iPhone 15 is sleek and professional. Perfect for business use. The camera night mode is amazing!',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      },
      {
        productId: '9038857732328', // Pink 256GB  
        customerName: 'Jessica Park',
        rating: 5,
        reviewText: 'Love the pink color! It\'s so elegant and the 256GB storage is perfect for all my photos and videos. Highly recommend!',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      },
      {
        productId: '9038857732329', // Green 512GB
        customerName: 'David Thompson',
        rating: 4,
        reviewText: 'Green is a unique color choice! Great performance and the extra storage is worth it for power users.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      },
      {
        productId: '9038857732330', // Natural Titanium 1TB
        customerName: 'Alex Johnson',
        rating: 5,
        reviewText: 'The titanium finish is absolutely premium! 1TB storage handles everything I throw at it. Worth every penny.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1567581935884-3349723552ca?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: iphoneGroup.id
      }
    ];
    
    // MacBook Pro Reviews with realistic images
    const macbookReviews = [
      {
        productId: '9038857732340', // 14-inch Silver
        customerName: 'Jennifer Liu',
        rating: 5,
        reviewText: 'This MacBook Pro is a beast! M3 chip handles video editing like a dream. The 14-inch screen is perfect for portability.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: macbookGroup.id
      },
      {
        productId: '9038857732341', // 14-inch Space Gray
        customerName: 'Robert Kim',
        rating: 4,
        reviewText: 'Love the space gray color! Performance is incredible for coding and development work. Battery life is impressive.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: macbookGroup.id
      },
      {
        productId: '9038857732342', // 16-inch Silver
        customerName: 'Maria Garcia',
        rating: 5,
        reviewText: 'The 16-inch screen is perfect for design work! Colors are vibrant and the speakers sound amazing. Highly recommend for creatives.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com',
        productGroupId: macbookGroup.id
      }
    ];
    
    // Insert iPhone reviews
    for (const review of iphoneReviews) {
      await prisma.review.create({ data: review });
    }
    console.log(`📱 Added ${iphoneReviews.length} iPhone 15 reviews`);
    
    // Insert MacBook reviews  
    for (const review of macbookReviews) {
      await prisma.review.create({ data: review });
    }
    console.log(`💻 Added ${macbookReviews.length} MacBook Pro reviews`);
    
    // Add some standalone product reviews (not in any group)
    const standaloneReviews = [
      {
        productId: '9038857732350', // AirPods Pro
        customerName: 'Chris Wilson',
        rating: 5,
        reviewText: 'Best noise cancellation I\'ve ever experienced! Sound quality is top-notch.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com'
      },
      {
        productId: '9038857732351', // Apple Watch
        customerName: 'Lisa Chen',
        rating: 4,
        reviewText: 'Great fitness tracking and the health features are amazing. Battery life could be better.',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop']),
        approved: true,
        shop: 'tryongoeye.myshopify.com'
      }
    ];
    
    for (const review of standaloneReviews) {
      await prisma.review.create({ data: review });
    }
    console.log(`⌚ Added ${standaloneReviews.length} standalone product reviews`);
    
    // Show summary
    console.log('\n📊 DEMO SETUP COMPLETE!');
    console.log('================================');
    
    const iphoneGroupReviews = await prisma.review.findMany({
      where: { productGroupId: iphoneGroup.id }
    });
    const macbookGroupReviews = await prisma.review.findMany({
      where: { productGroupId: macbookGroup.id }
    });
    const standaloneTotal = await prisma.review.count({
      where: { productGroupId: null }
    });
    
    console.log(`📱 iPhone 15 Collection:`);
    console.log(`   - Products: ${JSON.parse(iphoneGroup.productIds).length}`);
    console.log(`   - Reviews: ${iphoneGroupReviews.length}`);
    console.log(`   - Avg Rating: ${(iphoneGroupReviews.reduce((sum, r) => sum + r.rating, 0) / iphoneGroupReviews.length).toFixed(1)}/5`);
    
    console.log(`💻 MacBook Pro 2024:`);
    console.log(`   - Products: ${JSON.parse(macbookGroup.productIds).length}`);
    console.log(`   - Reviews: ${macbookGroupReviews.length}`);
    console.log(`   - Avg Rating: ${(macbookGroupReviews.reduce((sum, r) => sum + r.rating, 0) / macbookGroupReviews.length).toFixed(1)}/5`);
    
    console.log(`⌚ Standalone Products: ${standaloneTotal} reviews`);
    
    console.log('\n🎯 TEST URLs:');
    console.log(`iPhone 15 Blue (grouped): /api/reviews?productId=9038857732326`);
    console.log(`iPhone 15 Black (grouped): /api/reviews?productId=9038857732327`);
    console.log(`MacBook 14" (grouped): /api/reviews?productId=9038857732340`);
    console.log(`AirPods Pro (standalone): /api/reviews?productId=9038857732350`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProductGroupingDemo(); 