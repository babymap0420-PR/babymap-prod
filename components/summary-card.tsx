"use client";

import { CalendarDays, MessageCircle, ThumbsUp } from "lucide-react";

import { ageLabel, categoryLabel } from "@/data/lookups";
import { cn } from "@/lib/cn";
import { formatDistance, formatEventWhen } from "@/lib/format";
import { listingPhoto } from "@/lib/photos";
import { openClosedLabel } from "@/lib/hours";
import type { MapLocation } from "@/types/location";

export function SummaryCard({
  location,
  onDetails,
  variant = "sheet",
  selected = false,
  onHover,
  nearbyEventCount = 0,
}: {
  location: MapLocation;
  onDetails: () => void;
  variant?: "sheet" | "list";
  selected?: boolean;
  onHover?: (id: string | null) => void;
  nearbyEventCount?: number;
}) {
  const photo = listingPhoto(location.cover_photo_url, location.photo_urls);
  const ages = location.age_tags.map(ageLabel).join(", ");
  const openClosed =
    location.type === "place"
      ? openClosedLabel(location.place_details?.operating_hours)
      : null;
  const meta =
    location.type === "event"
      ? formatEventWhen(location.event_details?.start_datetime)
      : openClosed;
  const distance =
    location.distance_m != null ? formatDistance(location.distance_m) : "";
  const cost =
    location.cost_type === "free" ? "Free" : location.cost_detail || "Paid";

  if (variant === "list") {
    return (
      <button
        type="button"
        onClick={onDetails}
        onMouseEnter={() => onHover?.(location.id)}
        onMouseLeave={() => onHover?.(null)}
        className={cn(
          "flex w-full gap-3 rounded-2xl border bg-white p-3 text-left shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition",
          selected
            ? "border-[#ff6b6b]"
            : "border-[#f0ebe3] hover:border-[#e7e5e4]",
        )}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-[#f0ebe3]" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-[15px] font-bold text-[#1c1917]">
              {location.name}
            </span>
            {location.type === "event" && location.cost_type === "free" ? (
              <span className="shrink-0 rounded-full bg-[#e8f8ee] px-2 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                Free
              </span>
            ) : null}
          </span>
          {location.type === "event" ? (
            <>
              <span className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#ff6b6b]">
                <CalendarDays size={12} />
                {meta}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-[#78716c]">
                {location.address}
              </span>
              <span className="mt-2 flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#16a34a]">
                  <ThumbsUp size={12} /> {location.upvote_count}
                </span>
                <span className="truncate text-[#a8a29e]">
                  {location.event_details?.host_name
                    ? `by ${location.event_details.host_name}`
                    : ""}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="mt-0.5 block truncate text-[12px] text-[#78716c]">
                <span className="font-semibold text-[#44403c]">
                  {categoryLabel(location.category)}
                </span>
                {distance ? ` · ${distance}` : ""}
              </span>
              {location.description ? (
                <span className="mt-0.5 block truncate text-[12px] text-[#a8a29e]">
                  {location.description}
                </span>
              ) : null}
              <span className="mt-2 flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#16a34a]">
                    <ThumbsUp size={12} /> {location.upvote_count}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#78716c]">
                    <MessageCircle size={12} /> {location.review_count}
                  </span>
                </span>
                {nearbyEventCount > 0 ? (
                  <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[11px] font-semibold text-[#ff6b6b]">
                    {nearbyEventCount} event{nearbyEventCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </span>
            </>
          )}
        </span>
      </button>
    );
  }

  return (
    <article className="pointer-events-auto overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_rgba(28,25,23,0.14)]">
      <div className="flex gap-3 p-3">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-24 w-24 shrink-0 rounded-xl bg-[#f0ebe3]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-[#1c1917]">
            {location.name}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#78716c]">
            {categoryLabel(location.category)}
            {ages ? ` · ${ages}` : ""}
          </p>
          <p className="mt-0.5 text-[13px] text-[#78716c]">
            {[meta, distance, cost].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 flex items-center gap-3 text-[12px] text-[#16a34a]">
            <span className="inline-flex items-center gap-1 font-semibold">
              <ThumbsUp size={13} /> {location.upvote_count}
            </span>
            <span className="inline-flex items-center gap-1 text-[#78716c]">
              <MessageCircle size={13} /> {location.review_count} reviews
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDetails}
        className="w-full border-t border-[#f0ebe3] py-2.5 text-[14px] font-semibold text-[#ff6b6b]"
      >
        Details
      </button>
    </article>
  );
}
