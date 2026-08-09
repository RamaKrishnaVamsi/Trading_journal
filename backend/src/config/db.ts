import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI || "mongodb+srv://rvsrkvamsi_db_user:M5y09sPHi0UZoipB@data.xgm2jnd.mongodb.net/?appName=Data";
  try {
    await mongoose.connect(uri);
    console.log(`[db] connected -> ${uri}`);
  } catch (err) {
    console.error("[db] connection failed:", err);
    process.exit(1);
  }
}
