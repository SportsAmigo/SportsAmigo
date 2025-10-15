/**
 * Shop Sample Data Seeder
 * Run this script to populate the database with sample shop items
 */

const mongoose = require('./config/mongodb');
const ShopItemSchema = require('./models/schemas/shopItemSchema');

// Sample shop items data
const sampleItems = [
    {
        name: "Professional Football",
        price: 45.99,
        category: "Equipment",
        imageUrl: "/images/football_buy.jpeg",
        stock: 25,
        description: "Official size and weight football perfect for professional matches and training sessions.",
        featured: true
    },
    {
        name: "Sports Team Jersey",
        price: 35.00,
        category: "Apparel", 
        imageUrl: "/images/sports_jersey.jpg",
        stock: 50,
        description: "High-quality polyester team jersey with moisture-wicking technology. Available in multiple sizes.",
        featured: true
    },
    {
        name: "Athletic Running Shoes",
        price: 89.99,
        category: "Footwear",
        imageUrl: "/images/running_shoes2.webp", 
        stock: 30,
        description: "Lightweight running shoes with advanced cushioning and breathable mesh upper for maximum comfort.",
        featured: true
    },
    {
        name: "Sports Water Bottle",
        price: 12.99,
        category: "Accessories",
        imageUrl: "/images/sports_water_bottle.jpg",
        stock: 100,
        description: "BPA-free sports water bottle with easy-squeeze design and measurement markers."
    },
    {
        name: "Basketball",
        price: 29.99,
        category: "Equipment",
        imageUrl: "/images/basketball_img.jpg",
        stock: 20,
        description: "Official size basketball with superior grip and bounce. Perfect for indoor and outdoor play."
    },
    {
        name: "Training Shorts",
        price: 24.99,
        category: "Apparel",
        imageUrl: "/images/training_shorts.jpg",
        stock: 40,
        description: "Comfortable training shorts with elastic waistband and side pockets. Quick-dry fabric."
    },
    {
        name: "Soccer Cleats",
        price: 79.99,
        category: "Footwear",
        imageUrl: "/images/soccer_Cleats.jpg",
        stock: 25,
        description: "Professional soccer cleats with molded studs for optimal traction on grass fields."
    },
    {
        name: "Sports Headband",
        price: 8.99,
        category: "Accessories", 
        imageUrl: "/images/sports_headband.jpg",
        stock: 75,
        description: "Moisture-wicking sports headband to keep sweat out of your eyes during intense workouts."
    },
    {
        name: "Cricket Bat",
        price: 65.00,
        category: "Equipment",
        imageUrl: "/images/cricket_bat.jpg",
        stock: 15,
        description: "Professional grade cricket bat made from premium willow wood with comfortable grip."
    },
    {
        name: "Compression T-Shirt",
        price: 32.99,
        category: "Apparel",
        imageUrl: "/images/compression_tshirt.jpg",
        stock: 35,
        description: "Performance compression t-shirt that supports muscles and enhances blood circulation.",
        featured: true
    },
    {
        name: "Tennis Racket",
        price: 95.00,
        category: "Equipment",
        imageUrl: "/images/tennis_racket.jpeg",
        stock: 12,
        description: "Lightweight tennis racket with oversized head for increased sweet spot and power."
    },
    {
        name: "Gym Gloves",
        price: 18.99,
        category: "Accessories",
        imageUrl: "/images/gym_gloves.jpg",
        stock: 60,
        description: "Padded gym gloves with wrist support for weightlifting and cross-training exercises."
    },
    {
        name: "Track Pants",
        price: 42.00,
        category: "Apparel",
        imageUrl: "/images/track_pant.webp",
        stock: 28,
        description: "Comfortable track pants with tapered fit and zip pockets. Perfect for training and casual wear."
    },
    {
        name: "Baseball Cap",
        price: 16.99,
        category: "Accessories",
        imageUrl: "/images/baseball_Cap.jpg",
        stock: 50,
        description: "Adjustable baseball cap with team logo embroidery and UV protection."
    },
    {
        name: "Yoga Mat",
        price: 35.99,
        category: "Equipment",
        imageUrl: "/images/yoga_mat.jpg",
        stock: 22,
        description: "Non-slip yoga mat with extra thickness for comfort and stability during practice."
    },
    {
        name: "Sports Socks (3-Pack)",
        price: 14.99,
        category: "Apparel",
        imageUrl: "/images/sports_socks.jpeg",
        stock: 80,
        description: "Cushioned athletic socks with moisture-wicking technology. Pack of 3 pairs."
    },
    {
        name: "Resistance Bands Set",
        price: 24.99,
        category: "Equipment",
        imageUrl: "/images/resistance_bands.jpg",
        stock: 30,
        description: "Complete set of resistance bands with different tension levels for strength training."
    },
    {
        name: "Sports Towel",
        price: 11.99,
        category: "Accessories",
        imageUrl: "/images/sports_towel.jpeg",
        stock: 65,
        description: "Quick-dry microfiber sports towel that's lightweight and highly absorbent."
    }
];

/**
 * Seed the database with sample shop items
 */
async function seedShopItems() {
    try {
        console.log('Starting shop items seeder...');

        // Clear existing items (optional - comment out if you want to keep existing data)
        await ShopItemSchema.deleteMany({});
        console.log('Cleared existing shop items');

        // Insert sample items
        const result = await ShopItemSchema.insertMany(sampleItems);
        console.log(`Successfully seeded ${result.length} shop items:`);
        
        result.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} - ₹${item.price} (Stock: ${item.stock})`);
        });

        console.log('\n✅ Shop seeding completed successfully!');
        console.log('\nYou can now:');
        console.log('1. Visit /shop to browse products');
        console.log('2. Test the search functionality');
        console.log('3. Add items to cart (requires login)');
        console.log('4. Test the checkout process');

    } catch (error) {
        console.error('❌ Error seeding shop items:', error);
    } finally {
        // Close database connection
        mongoose.connection.close();
    }
}

/**
 * Create default product images directory and placeholder
 */
function createImagePlaceholders() {
    const fs = require('fs');
    const path = require('path');
    
    const shopImagesDir = path.join(__dirname, 'public', 'images', 'shop');
    
    if (!fs.existsSync(shopImagesDir)) {
        fs.mkdirSync(shopImagesDir, { recursive: true });
        console.log('Created shop images directory:', shopImagesDir);
    }
    
    // Create a simple placeholder image info
    const placeholderInfo = `
# Shop Images Directory

This directory should contain product images for the SportsAmigo shop.

## Required Images:
- football.jpg
- jersey.jpg
- running-shoes.jpg
- water-bottle.jpg
- basketball.jpg
- shorts.jpg
- soccer-cleats.jpg
- headband.jpg
- cricket-bat.jpg
- compression-shirt.jpg
- tennis-racket.jpg
- gym-gloves.jpg
- track-pants.jpg
- baseball-cap.jpg
- yoga-mat.jpg
- sports-socks.jpg
- resistance-bands.jpg
- sports-towel.jpg
- default-product.jpg (fallback image)

## Image Specifications:
- Format: JPG or PNG
- Recommended size: 400x400px
- Keep file sizes under 500KB for better performance
`;
    
    fs.writeFileSync(path.join(shopImagesDir, 'README.md'), placeholderInfo);
    console.log('Created image directory guide');
}

// Run the seeder if this file is executed directly
if (require.main === module) {
    console.log('🌱 SportsAmigo Shop Seeder');
    console.log('=============================\n');
    
    // Create image directories first
    createImagePlaceholders();
    
    // Wait for database connection then seed
    mongoose.connection.once('open', () => {
        console.log('📦 Connected to MongoDB');
        seedShopItems();
    });
    
    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
}

module.exports = { seedShopItems, sampleItems };