import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import connectDB from "./db.js";
import User, { SEED_USERS } from './models/User.js';
import { InventoryItem, Location, Transaction } from './models/Inventory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INVENTORY_SEED_PATH = path.join(__dirname, 'data', 'inventory_seed');

// **********************************************
// ********* USER SEEDING ***********************
// **********************************************
async function seedUsersData() {
  try {
    console.log("👤 Seeding users (Admin, Branch Manager, Volunteer, Affected Citizen)...");
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const userData of SEED_USERS) {
      const userExists = await User.findOne({ username: userData.username });
      if (!userExists) {
        await User.create(userData);
        console.log(`\t✅ Created user: ${userData.username} (${userData.role})`);
        createdCount++;
      } else {
        // Update existing user to ensure role and other fields are correct
        await User.findOneAndUpdate(
          { username: userData.username },
          { 
            ...userData,
            password: userData.password // Will be hashed by pre-save middleware
          },
          { new: true }
        );
        console.log(`\t🔄 Updated user: ${userData.username} (${userData.role})`);
        updatedCount++;
      }
    }
    
    if (createdCount > 0 || updatedCount > 0) {
      console.log(`✅ User seeding complete. Created: ${createdCount}, Updated: ${updatedCount}`);
    } else {
      console.log("ℹ️  All seed users already exist.");
    }
  } catch (err) {
    console.error("❌ Error seeding user data:", err.message);
  }
}

// **********************************************
// ********* INVENTORY SEEDING ******************
// **********************************************
const readJsonFile = (filename) => {
  const filePath = path.join(INVENTORY_SEED_PATH, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Seed file not found: ${filePath}`);
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

async function seedInventoryData() {
  try {
    const itemCount = await InventoryItem.countDocuments();
    if (itemCount === 0) {
      console.log("🌱 Seeding Inventory Items...");
      const inventoryData = readJsonFile('inventory_items_seed.json');
      if (inventoryData.length > 0) {
        await InventoryItem.insertMany(inventoryData);
      }
    }

    const locationCount = await Location.countDocuments();
    if (locationCount === 0) {
      console.log("📍 Seeding Locations...");
      const locationData = readJsonFile('locations_seed.json');
      if (locationData.length > 0) {
        await Location.insertMany(locationData);
      }
    }

    const transactionCount = await Transaction.countDocuments();
    if (transactionCount === 0) {
      console.log("📦 Seeding Transactions...");
      const transactionData = readJsonFile('transactions_seed.json');
      if (transactionData.length > 0) {
        await Transaction.insertMany(transactionData);
      }
    }

    console.log("✅ Inventory data seeding complete.");
  } catch (err) {
    console.error("❌ Error seeding inventory data:", err.message);
  }
}

// **********************************************
// ********* MAIN SEEDING FUNCTION **************
// **********************************************
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    await seedUsersData();
    await seedInventoryData();
    console.log("✅ Database seeding completed successfully!");
  } catch (err) {
    console.error("❌ Database seeding failed:", err.message);
  } finally {
    process.exit(0);
  }
}

// **********************************************
// ********* RUN SEEDING ************************
// **********************************************
connectDB()
  .then(async () => {
    console.log("✅ Database connected successfully");
    await seedDatabase();
  })
  .catch((err) => {
    console.error("❌ Failed to connect to DB:", err.message);
    process.exit(1);
  });