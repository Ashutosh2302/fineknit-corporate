import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cache;
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  console.log("MONGO URI:", process.env.MONGODB_URI);
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME ?? "fineknit",
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
