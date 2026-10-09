"use client";

import { Search, X } from "lucide-react";

import { cn } from "@/lib/cn";

export function SearchBar({
  query,
  onQueryChange,
  onFocus,
  onClear,
  variant = "floating",
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
  variant?: "floating" | "sidebar";
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-4",
        variant === "sidebar"
          ? "h-11 rounded-full bg-[#f3f1ed]"
          : "h-12 rounded-full bg-white shadow-[0_8px_24px_rgba(28,25,23,0.10)]",
      )}
    >
      <Search size={18} className="shrink-0 text-[#a8a29e]" />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onFocus}
        placeholder="Search places, events, or an address..."
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#1c1917] outline-none placeholder:text-[#a8a29e]"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="rounded-full p-1 text-[#78716c] hover:bg-[#f0ebe3]"
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}
