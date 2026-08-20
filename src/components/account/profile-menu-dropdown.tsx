"use client";

import { CircleUserRound, LogOut, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiRequestError, signOutRequest } from "@/lib/api/auth-client";
import type { AuthUserDto } from "@/types/auth";

export function ProfileMenuDropdown({
  user,
  profileHref,
  onClose,
}: {
  user: AuthUserDto;
  profileHref: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOutRequest();
      router.push("/signin");
    } catch (error) {
      setIsSigningOut(false);
      setSignOutError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div
      role="menu"
      className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <CircleUserRound className="h-6 w-6" strokeWidth={1.75} />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="p-2">
        {signOutError && !showSignOutConfirm && (
          <p className="px-2 py-1 text-xs font-medium text-red-600">{signOutError}</p>
        )}

        <Link
          href={profileHref}
          role="menuitem"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <UserCog className="h-5 w-5 text-slate-500" strokeWidth={2} />
          Update Profile
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={() => setShowSignOutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
          Sign Out
        </button>
      </div>

      {showSignOutConfirm && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !isSigningOut && setShowSignOutConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signout-confirm-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h3 id="signout-confirm-title" className="text-base font-semibold text-slate-900">
                    Sign Out?
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You&apos;ll need to sign in again to access your account.
                  </p>
                </div>
              </div>

              {signOutError && (
                <p className="mt-3 text-xs font-medium text-red-600">{signOutError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
