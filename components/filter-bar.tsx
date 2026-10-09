"use client";

import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { categoriesForTab, AGE_TAGS } from "@/data/lookups";
import { cn } from "@/lib/cn";
import type { DatePreset } from "@/lib/format";
import type { TypeTab } from "@/types/location";

const TABS: { id: TypeTab; label: string; icon: typeof Sparkles }[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "place", label: "Places", icon: MapPin },
  { id: "event", label: "Events", icon: CalendarDays },
];

const DATE_CHIPS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "next_month", label: "Next month" },
  { id: "custom", label: "Custom dates" },
];

export function FilterBar({
  tab,
  onTabChange,
  categories,
  onToggleCategory,
  ageTags,
  onToggleAge,
  freeOnly,
  onToggleFree,
  datePreset,
  onDatePreset,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  variant = "overlay",
  placeCount,
  eventCount,
}: {
  tab: TypeTab;
  onTabChange: (tab: TypeTab) => void;
  categories: string[];
  onToggleCategory: (id: string) => void;
  ageTags: string[];
  onToggleAge: (id: string) => void;
  freeOnly: boolean;
  onToggleFree: () => void;
  datePreset: DatePreset;
  onDatePreset: (preset: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  variant?: "overlay" | "sidebar";
  placeCount?: number;
  eventCount?: number;
}) {
  const typeChips = categoriesForTab(tab);
  const counts: Record<TypeTab, number | undefined> = {
    all: undefined,
    place: placeCount,
    event: eventCount,
  };

  return (
    <div className={cn("flex flex-col", variant === "sidebar" ? "gap-3" : "gap-2")}>
      {variant === "sidebar" ? (
        <div className="flex items-center gap-1 border-b border-[#f0ebe3] px-1">
          {TABS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-semibold",
                  active ? "text-[#1c1917]" : "text-[#a8a29e] hover:text-[#57534e]",
                )}
              >
                <Icon
                  size={14}
                  className={
                    item.id === "place"
                      ? active
                        ? "text-[#3d9a4a]"
                        : undefined
                      : item.id === "event"
                        ? active
                          ? "text-[#ff6b6b]"
                          : undefined
                        : undefined
                  }
                />
                {item.label}
                {count != null ? (
                  <span className={active ? "text-[#78716c]" : "text-[#d6d3d1]"}>
                    ({count})
                  </span>
                ) : null}
                {active ? (
                  <span
                    className={cn(
                      "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                      item.id === "event" ? "bg-[#ff6b6b]" : "bg-[#3d9a4a]",
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex rounded-full bg-[#f0ebe3] p-1">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-[13px] font-semibold",
                  active
                    ? "bg-white text-[#1c1917] shadow-[0_2px_8px_rgba(28,25,23,0.08)]"
                    : "text-[#78716c] hover:text-[#1c1917]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {tab !== "all" && typeChips.length > 0 ? (
        <>
          {variant === "sidebar" ? (
            <p className="px-1 text-[11px] font-semibold tracking-wide text-[#a8a29e] uppercase">
              Quick Filters
            </p>
          ) : null}
          <ChipRow wrap={variant === "sidebar"}>
            {typeChips.map((chip) => (
              <Chip
                key={chip.id}
                active={categories.includes(chip.id)}
                onClick={() => onToggleCategory(chip.id)}
              >
                {chip.emoji} {chip.label}
              </Chip>
            ))}
            <Chip active={freeOnly} onClick={onToggleFree}>
              Free
            </Chip>
          </ChipRow>
        </>
      ) : null}

      {variant === "sidebar" ? (
        <p className="flex items-center gap-1.5 px-1 text-[12px] font-semibold text-[#78716c]">
          <span aria-hidden>☷</span> Age Group
        </p>
      ) : null}

      <ChipRow wrap={variant === "sidebar"}>
        {AGE_TAGS.map((chip) => (
          <Chip
            key={chip.id}
            active={ageTags.includes(chip.id)}
            onClick={() => onToggleAge(chip.id)}
          >
            {chip.emoji} {chip.label}
          </Chip>
        ))}
      </ChipRow>

      {tab === "event" ? (
        <>
          <ChipRow>
            {DATE_CHIPS.map((chip) => (
              <Chip
                key={chip.id}
                active={datePreset === chip.id}
                onClick={() =>
                  onDatePreset(datePreset === chip.id ? "default" : chip.id)
                }
              >
                {chip.label}
              </Chip>
            ))}
          </ChipRow>
          {datePreset === "custom" ? (
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(event) => onCustomFrom(event.target.value)}
                className="h-9 flex-1 rounded-xl border border-[#e7e5e4] bg-white px-3 text-[13px] text-[#1c1917]"
              />
              <input
                type="date"
                value={customTo}
                onChange={(event) => onCustomTo(event.target.value)}
                className="h-9 flex-1 rounded-xl border border-[#e7e5e4] bg-white px-3 text-[13px] text-[#1c1917]"
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ChipRow({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2 pb-0.5",
        wrap
          ? "flex-wrap"
          : "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium",
        active
          ? "border-[#ff6b6b] bg-[#ff6b6b] text-white"
          : "border-[#e7e5e4] bg-white text-[#44403c] hover:bg-[#fafaf9]",
      )}
    >
      {dot && !active ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dot }}
        />
      ) : null}
      {children}
    </button>
  );
}
