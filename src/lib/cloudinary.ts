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

/**
 * Deletes every file uploaded for this user's medical documents
 * (storage.py's `mediscan/<user_id>/` folder — resource_type is "auto" at
 * upload time, so originals can land as image, raw, or video) and the
 * user's avatar, then removes the now-empty per-user folder. Called from
 * user deletion so no orphaned files are left behind in Cloudinary.
 */
export async function deleteUserCloudinaryAssets(userId: string): Promise<void> {
  ensureConfigured();

  const documentsFolder = `mediscan/${userId}`;
  await Promise.all(
    (["image", "raw", "video"] as const).map((resource_type) =>
      cloudinary.api
        .delete_resources_by_prefix(documentsFolder, { resource_type })
        .catch(() => undefined),
    ),
  );
  await cloudinary.api.delete_folder(documentsFolder).catch(() => undefined);

  await cloudinary.uploader
    .destroy(`${AVATAR_FOLDER}/${userId}`, { resource_type: "image" })
    .catch(() => undefined);
}

const DOCUMENTS_FOLDER = "mediscan";

/**
 * Counts files under this user's `mediscan/<user_id>/` folder — the source
 * of truth for "how many documents has this user uploaded", since it counts
 * actual stored files regardless of resource_type (image/raw/video) rather
 * than relying on the `documents` Mongo collection, which only holds one
 * record per successfully *extracted* page.
 */
export async function countUserDocuments(userId: string): Promise<number> {
  ensureConfigured();

  const result = await cloudinary.search
    .expression(`folder=${DOCUMENTS_FOLDER}/${userId}`)
    .max_results(1)
    .execute();

  return (result.total_count as number) ?? 0;
}
