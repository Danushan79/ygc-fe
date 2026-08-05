import mongoose from "mongoose";
import { env } from "@/config/env";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cache = (globalThis.mongooseCache ??= { conn: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set. Configure it in your .env file.");
  }

  cache.promise ??= mongoose.connect(env.mongodbUri);
  cache.conn = await cache.promise;

  return cache.conn;
}
