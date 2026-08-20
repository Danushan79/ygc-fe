"use client";

import { Camera, CircleUserRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { MAX_AVATAR_FILE_SIZE_BYTES, MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { ApiRequestError, updateProfileRequest } from "@/lib/api/auth-client";
import type { AuthUserDto, UpdateProfileRequestBody } from "@/types/auth";

type ProfileErrors = {
  fullName?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

export function ProfileForm({ user }: { user: AuthUserDto }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);
  const [avatarChanged, setAvatarChanged] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Please choose an image file." }));
      return;
    }
    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, avatar: "Image must be smaller than 3MB." }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
        setAvatarChanged(true);
      }
    };
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const nextErrors: ProfileErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (newPassword || currentPassword || confirmNewPassword) {
      if (!currentPassword) {
        nextErrors.currentPassword = "Enter your current password.";
      }
      if (!newPassword) {
        nextErrors.newPassword = "Enter a new password.";
      } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
        nextErrors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (!confirmNewPassword) {
        nextErrors.confirmNewPassword = "Please confirm your new password.";
      } else if (confirmNewPassword !== newPassword) {
        nextErrors.confirmNewPassword = "Passwords do not match.";
      }
    }

    setErrors((prev) => ({ avatar: prev.avatar, ...nextErrors }));
    return Object.values(nextErrors).every((value) => !value);
  }

  function applyServerError(error: ApiRequestError) {
    const message = error.message;

    if (error.status === 401) {
      setErrors((prev) => ({ ...prev, currentPassword: message }));
      return;
    }

    if (error.status === 400 || error.status === 409) {
      if (/current password/i.test(message)) {
        setErrors((prev) => ({ ...prev, currentPassword: message }));
        return;
      }
      if (/password/i.test(message)) {
        setErrors((prev) => ({ ...prev, newPassword: message }));
        return;
      }
      if (/name/i.test(message)) {
        setErrors((prev) => ({ ...prev, fullName: message }));
        return;
      }
      if (/photo/i.test(message)) {
        setErrors((prev) => ({ ...prev, avatar: message }));
        return;
      }
    }

    setFormError(message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    const payload: UpdateProfileRequestBody = { fullName: fullName.trim() };
    if (avatarChanged) {
      payload.avatarUrl = avatarPreview ?? "";
    }
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateProfileRequest(payload);
      setSuccessMessage("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setAvatarChanged(false);
      setAvatarPreview(updated.avatarUrl);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        applyServerError(error);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {successMessage && <FormBanner tone="success">{successMessage}</FormBanner>}
      {formError && <FormBanner tone="error">{formError}</FormBanner>}

      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <CircleUserRound className="h-12 w-12" strokeWidth={1.5} />
            )}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            disabled={isSubmitting}
            className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-sm transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera className="h-4 w-4" strokeWidth={2} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isSubmitting}
          />
        </div>
        {errors.avatar && <p className="text-xs font-medium text-red-600">{errors.avatar}</p>}
      </div>

      <FormField
        id="fullName"
        label="Full Name"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        error={errors.fullName}
        disabled={isSubmitting}
      />

      <div>
        <FormField id="email" label="Email Address" type="email" value={user.email} disabled />
        <p className="mt-1.5 text-xs text-slate-500">Email address cannot be changed.</p>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
        <p className="mt-1 text-xs text-slate-500">
          Leave these blank to keep your current password.
        </p>

        <div className="mt-4 flex flex-col gap-6">
          <FormField
            id="currentPassword"
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={errors.currentPassword}
            disabled={isSubmitting}
          />

          <FormField
            id="newPassword"
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={errors.newPassword}
            disabled={isSubmitting}
          />

          <FormField
            id="confirmNewPassword"
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            error={errors.confirmNewPassword}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-700 to-blue-800 py-3 font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:shadow-lg hover:shadow-blue-900/25 hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-md disabled:hover:brightness-100"
      >
        {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />}
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
