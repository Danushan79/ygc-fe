import { v2 as cloudinary } from "cloudinary";
import { env } from "@/config/env";

let isConfigured = false;

function ensureConfigured(): void {
  if (isConfigured) {
    return;
  }

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
    );
  }

  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
  isConfigured = true;
}

const AVATAR_FOLDER = "mediscan/avatars";

export async function uploadAvatar(dataUri: string, userId: string): Promise<string> {
  ensureConfigured();

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: AVATAR_FOLDER,
    public_id: userId,
    overwrite: true,
    resource_type: "image",
    transformation: [{ width: 512, height: 512, crop: "limit" }],
  });

  return result.secure_url;
}
