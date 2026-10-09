"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { getProfile } from "@/lib/api";
import { getAppUserId, getDisplayName, setDisplayName } from "@/lib/user";
import type { Badge } from "@/types/location";

export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(getDisplayName());
  const [badges, setBadges] = useState<Badge[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void getProfile(getAppUserId(), getDisplayName() || undefined)
      .then((data) => setBadges(data.all_badges ?? data.badges ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load badges"),
      );
  }, []);

  return (
    <div className="pointer-events-auto max-h-[min(80dvh,640px)] overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_16px_40px_rgba(28,25,23,0.16)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#1c1917]">Your badges</h2>
        <button type="button" onClick={onClose} aria-label="Close profile">
          <X size={18} className="text-[#78716c]" />
        </button>
      </div>
      <label className="mt-4 block text-[13px] font-medium text-[#1c1917]">
        Display name
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setDisplayName(event.target.value);
          }}
          placeholder="Parent"
          className="mt-1 h-11 w-full rounded-xl border border-[#e7e5e4] bg-[#f7f4ef] px-3 text-[15px]"
        />
      </label>
      {error ? <p className="mt-3 text-[13px] text-[#ff6b6b]">{error}</p> : null}
      <ul className="mt-4 space-y-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className="flex gap-3 rounded-2xl border border-[#e7e5e4] p-3"
          >
            <span className="text-[28px]">{badge.icon_url}</span>
            <div>
              <p className="font-semibold text-[#1c1917]">{badge.name}</p>
              <p className="text-[13px] text-[#78716c]">{badge.description}</p>
              <p className="mt-1 text-[12px] font-medium text-[#16a34a]">
                {badge.earned ? "Earned" : "In progress"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
