import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { SEED_USERS } from './models/User.js';
import connectDB from './db.js';

dotenv.config();

async function seedUsersData() {
  try {
    console.log("👤 Seeding users (Admin, Branch Manager, Volunteer, Refugee)...");
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
    throw err;
  }
}

// Run seeding
connectDB()
  .then(async () => {
    console.log("✅ Database connected successfully");
    await seedUsersData();
    console.log("✅ Seeding completed. Closing connection...");
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed to seed users:", err.message);
    process.exit(1);
  });


