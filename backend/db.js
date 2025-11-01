import mongoose from "mongoose";
import dotenv from "dotenv"; // 👈 IMPORTING DOTENV

dotenv.config(); // 👈 LOADING ENVIRONMENT VARIABLES

/**
 * @description Establishes the connection to the MongoDB database using the URI in the .env file.
 */
const connectDB = async () => {
    try {
        // CRITICAL CHECK: Ensure the URI is present
        if (!process.env.MONGO_URI) {
            console.error("❌ Fatal Error: MONGO_URI is not defined in the .env file. Please check your configuration.");
            process.exit(1);
        }
        
        // Use the connection string from the environment variables
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB Connected successfully! Host: ${conn.connection.host}`);
        console.log(`📂 Using Database: ${conn.connection.name}`);
    } catch (error) {
        // More specific error logging for connection failures
        console.error(`❌ Connection Error: Failed to connect to MongoDB. Reason: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
