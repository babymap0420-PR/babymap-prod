"use client";

import { LogOut, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";

import type { KidSpotAccount } from "@/lib/user";

export function AccountMenu({
  account,
  open,
  onOpenChange,
  onSignOut,
  onSignIn,
}: {
  account: KidSpotAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
  onSignIn: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest("[data-account-menu]")) return;
      if (rootRef.current?.contains(target)) return;
      onOpenChange(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onOpenChange]);

  const label = account?.nickname || account?.name || "Account";
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} data-account-menu className="relative">
      <button
        type="button"
        aria-label={account ? `Account menu for ${label}` : "Sign in"}
        aria-expanded={account ? open : undefined}
        onClick={() => {
          if (!account) {
            onSignIn();
            return;
          }
          onOpenChange(!open);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6b6b] text-[15px] font-bold text-white shadow-[0_2px_8px_rgba(28,25,23,0.28)] ring-2 ring-white"
      >
        {account ? initial : <UserRound size={18} />}
      </button>
      {open && account ? (
        <div
          role="menu"
          className="absolute top-12 right-0 z-20 w-[260px] rounded-2xl bg-white p-4 text-left shadow-[0_12px_32px_rgba(28,25,23,0.18)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b6b] text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900">{label}</p>
              {account.email ? (
                <p className="truncate text-xs text-stone-500">{account.email}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onSignOut}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:bg-stone-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
