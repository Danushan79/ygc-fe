/**
 * Centralized environment configuration.
 * Read `process.env` only here so the rest of the app depends on this typed object
 * instead of scattering `process.env.X` (and its undefined-string footguns) everywhere.
 */

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  aiAssistantApiUrl: process.env.AI_ASSISTANT_API_URL,
  documentsApiBaseUrl: process.env.DOCUMENTS_API_BASE_URL ?? "http://127.0.0.1:8000",
} as const;

export const isProduction = env.nodeEnv === "production";
export const isDevelopment = env.nodeEnv === "development";
