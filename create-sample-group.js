const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleGroup() {
  try {
    console.log('Creating sample product group...');
    
    // Create a product group that includes the main product and some variants
    const productGroup = await prisma.productGroup.create({
      data: {
        shop: 'tryongoeye.myshopify.com',
        name: 'iPhone 15 Collection',
        description: 'All iPhone 15 models including different colors and storage variants',
        productIds: JSON.stringify([
          '9038857732326',  // Original product
          '9038857732327',  // iPhone 15 Black 128GB (simulated)
          '9038857732328',  // iPhone 15 Blue 256GB (simulated)
          '9038857732329'   // iPhone 15 Pink 512GB (simulated)
        ])
      }
    });
    
    console.log('Product group created:', productGroup);
    
    // Update existing reviews to be associated with this group
    const existingReviews = await prisma.review.findMany({
      where: {
        shop: 'tryongoeye.myshopify.com',
        productId: '9038857732326'
      }
    });
    
    console.log(`Found ${existingReviews.length} existing reviews to associate with group`);
    
    for (const review of existingReviews) {
      await prisma.review.update({
        where: { id: review.id },
        data: { productGroupId: productGroup.id }
      });
    }
    
    // Add some additional reviews for different products in the group
    const additionalReviews = [
      {
        productId: '9038857732327',
        customerName: 'David Rodriguez',
        rating: 5,
        reviewText: 'Love the black color! Sleek design and fantastic performance. The camera quality is incredible.',
        mediaUrls: JSON.stringify(['https://example.com/black-iphone.jpg'])
      },
      {
        productId: '9038857732328',
        customerName: 'Emily Watson',
        rating: 4,
        reviewText: 'Beautiful blue color and great storage capacity. Battery life is impressive too.',
        mediaUrls: JSON.stringify([])
      },
      {
        productId: '9038857732329',
        customerName: 'Alex Johnson',
        rating: 5,
        reviewText: 'Pink is gorgeous! Perfect size and the 512GB storage is more than enough for all my photos and apps.',
        mediaUrls: JSON.stringify(['https://example.com/pink-iphone.jpg'])
      }
    ];
    
    for (const reviewData of additionalReviews) {
      await prisma.review.create({
        data: {
          shop: 'tryongoeye.myshopify.com',
          ...reviewData,
          approved: true,
          productGroupId: productGroup.id
        }
      });
    }
    
    console.log('Added additional reviews for group products');
    console.log('Sample product group setup complete!');
    
    // Show summary
    const groupReviews = await prisma.review.findMany({
      where: { productGroupId: productGroup.id }
    });
    
    console.log(`\nSummary:`);
    console.log(`- Group: ${productGroup.name}`);
    console.log(`- Products: ${JSON.parse(productGroup.productIds).length}`);
    console.log(`- Total Reviews: ${groupReviews.length}`);
    console.log(`- Average Rating: ${(groupReviews.reduce((sum, r) => sum + r.rating, 0) / groupReviews.length).toFixed(1)}`);
    
  } catch (error) {
    console.error('Error creating sample group:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleGroup(); 