import mongoose from "mongoose";

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  const persistenceMode = process.env.PERSISTENCE_MODE || "memory";
  const mongoUri = process.env.MONGODB_URI;

  if (persistenceMode !== "mongodb" || !mongoUri || mongoUri.trim() === "") {
    console.log("📦 Persistence Mode: IN-MEMORY STORE (High-Speed Local)");
    isConnected = false;
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log("🍃 Connected to MongoDB Persistence Layer:", mongoUri);
    return true;
  } catch (error) {
    console.warn("⚠️ MongoDB connection failed. Falling back to IN-MEMORY STORE:", (error as Error).message);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
