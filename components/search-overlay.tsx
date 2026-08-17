"use client";

import { Search, X } from "lucide-react";
import { useMemo } from "react";

import { Stars } from "@/components/stars";
import { CATEGORY_FILTERS } from "@/data/events";
import { cn } from "@/lib/cn";
import { formatEventWhen } from "@/lib/format";
import {
  CATEGORY_LABELS,
  type BabyEvent,
  type EventCategory,
} from "@/types/event";

export function SearchOverlay({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  results,
  selectedEventId,
  isFocused,
  onFocusChange,
  onSelect,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  category: EventCategory | "all";
  onCategoryChange: (value: EventCategory | "all") => void;
  results: BabyEvent[];
  selectedEventId: string | null;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const showResults = isFocused;
  const heading = useMemo(() => {
    if (query.trim()) return `${results.length} events`;
    return "Suggested events";
  }, [query, results.length]);

  return (
    <div className="pointer-events-auto flex w-full flex-col gap-3">
      <div className="overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)]">
        <label className="flex h-12 items-center gap-3 px-4">
          <Search size={20} className="shrink-0 text-[#5f6368]" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => {
              window.setTimeout(() => onFocusChange(false), 180);
            }}
            placeholder="Search baby events, hosts, or places"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#202124] outline-none placeholder:text-[#80868b]"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="rounded-full p-1 text-[#5f6368] hover:bg-[#f1f3f4]"
            >
              <X size={18} />
            </button>
          ) : null}
        </label>

        {showResults ? (
          <div className="max-h-[min(52vh,420px)] overflow-y-auto border-t border-[#eee]">
            <p className="px-4 py-2 text-[12px] font-medium tracking-wide text-[#80868b] uppercase">
              {heading}
            </p>
            {results.length === 0 ? (
              <p className="px-4 pb-4 text-[14px] text-[#5f6368]">
                No events match that search.
              </p>
            ) : (
              <ul>
                {results.map((event) => {
                  const active = event.id === selectedEventId;
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
                        onClick={() => onSelect(event.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#f8f9fa]",
                          active && "bg-[#e8f0fe]",
                        )}
                      >
                        <img
                          src={event.photos[0]}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-[#202124]">
                            {event.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[12px] text-[#5f6368]">
                            <span className="font-medium text-[#188038]">
                              {event.rating.toFixed(1)}
                            </span>
                            <Stars rating={event.rating} size="sm" />
                            <span>· {CATEGORY_LABELS[event.category]}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-[#5f6368]">
                            {formatEventWhen(event.startsAt)} · {event.neighborhood}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_FILTERS.map((filter) => {
          const active = category === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onCategoryChange(filter.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium shadow-sm",
                active
                  ? "border-[#1967d2] bg-[#e8f0fe] text-[#1967d2]"
                  : "border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
