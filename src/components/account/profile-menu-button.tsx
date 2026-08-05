"use client";

import { CircleUserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProfileMenuDropdown } from "@/components/account/profile-menu-dropdown";
import type { AuthUserDto } from "@/types/auth";

export function ProfileMenuButton({
  user,
  profileHref,
}: {
  user: AuthUserDto;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500 transition-colors hover:border-blue-300"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <CircleUserRound className="h-5 w-5" strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <ProfileMenuDropdown user={user} profileHref={profileHref} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
