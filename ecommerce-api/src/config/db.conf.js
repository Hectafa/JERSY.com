import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-db-test",
    );
    console.log(`MongoDB connected ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting MongoDB");
    process.exit(1);
  }
};

export default connectDB;
