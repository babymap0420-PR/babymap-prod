"use client";

import {
  Bookmark,
  Flag,
  Globe,
  MapPin,
  Pencil,
  Share2,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { ageLabel, AMENITY_LABELS, categoryLabel } from "@/data/lookups";
import { cn } from "@/lib/cn";
import {
  formatDistance,
  formatEventHeadline,
  formatReviewDate,
  googleMapsDirectionsUrl,
} from "@/lib/format";
import { hoursSummary } from "@/lib/hours";
import { listingPhoto } from "@/lib/photos";
import type { LocationReview, MapLocation } from "@/types/location";

export function DetailPanel({
  location,
  upvoted,
  onClose,
  onUpvote,
  onFavourite,
  onShare,
  onFlag,
  onReview,
  canEdit = false,
  onEdit,
  currentUserId = null,
  onUpdateReview,
  onDeleteReview,
}: {
  location: MapLocation;
  upvoted: boolean;
  onClose: () => void;
  onUpvote: () => void;
  onFavourite: () => void;
  onShare: () => void;
  onFlag: () => void;
  onReview: (body: string, thumbsUp: boolean) => void;
  canEdit?: boolean;
  onEdit?: () => void;
  currentUserId?: string | null;
  onUpdateReview?: (reviewId: string, body: string) => void;
  onDeleteReview?: (reviewId: string) => void;
}) {
  const photos = [
    listingPhoto(location.cover_photo_url, location.photo_urls),
    ...(location.photo_urls ?? []).map((src) => listingPhoto(src)),
  ].filter((src, index, all): src is string => Boolean(src) && all.indexOf(src) === index);
  const photo = photos[0];
  const amenityTags = [
    ...(location.place_details?.amenities ?? []),
    ...(location.accessibility_notes ?? []),
    location.parking_available ? "parking" : null,
    location.place_details?.fenced ? "fenced" : null,
  ].filter((item): item is string => Boolean(item));
  const uniqueAmenities = Array.from(new Set(amenityTags.map((tag) => AMENITY_LABELS[tag] ?? tag)));
  const [reviewBody, setReviewBody] = useState("");
  const [thumbsUp, setThumbsUp] = useState(true);

  return (
    <article className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_12px_40px_rgba(28,25,23,0.16)] md:rounded-3xl">
      <div className="relative h-[200px] shrink-0 bg-[#f0ebe3]">
        {photo ? (
          <img src={photo} alt={location.name} className="h-full w-full object-cover" />
        ) : null}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1c1917] shadow-sm"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-bold tracking-wide text-[#ff6b6b] uppercase">
            {categoryLabel(location.category)}
          </p>
          <h1 className="mt-1 text-[22px] leading-7 font-bold text-[#1c1917]">
            {location.name}
          </h1>
          <p className="mt-1 text-[14px] text-[#78716c]">
            {location.type === "event"
              ? formatEventHeadline(
                  location.event_details?.start_datetime ?? "",
                  location.event_details?.end_datetime,
                )
              : hoursSummary(location.place_details?.operating_hours)}
            {` · ${location.cost_type === "free" ? "Free" : location.cost_detail || "Paid"}`}
          </p>
          <p className="mt-2 flex flex-wrap gap-3 text-[13px] text-[#78716c]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#16a34a]">
              <ThumbsUp size={14} /> {location.upvote_count}
            </span>
            <span>{location.review_count} reviews</span>
            <span>{location.favourite_count} favourites</span>
          </p>
        </div>

        <div className="flex justify-around border-y border-[#f0ebe3] px-2 py-3">
          <Action
            label={upvoted ? "Upvoted" : "Thumbs up"}
            active={upvoted}
            onClick={onUpvote}
            icon={<ThumbsUp size={18} />}
          />
          <Action
            label={location.is_favourite ? "Saved" : "Favourite"}
            active={Boolean(location.is_favourite)}
            onClick={onFavourite}
            icon={<Bookmark size={18} fill={location.is_favourite ? "currentColor" : "none"} />}
          />
          <Action label="Share" onClick={onShare} icon={<Share2 size={18} />} />
          <Action label="Flag" onClick={onFlag} icon={<Flag size={18} />} />
          {canEdit ? (
            <Action label="Edit" onClick={() => onEdit?.()} icon={<Pencil size={18} />} />
          ) : null}
        </div>

        <div className="space-y-3 px-5 py-4 text-[14px] text-[#44403c]">
          <p className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-[#a8a29e]" />
            <span>
              {location.address}
              {location.distance_m != null
                ? ` · ${formatDistance(location.distance_m)}`
                : ""}
              <a
                href={googleMapsDirectionsUrl(location.latitude, location.longitude)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block font-semibold text-[#ff6b6b]"
              >
                Directions
              </a>
            </span>
          </p>
          {location.description ? <p>{location.description}</p> : null}
          {location.type === "event" && location.event_details?.host_name ? (
            <p>
              Hosted by{" "}
              <span className="font-medium text-[#1c1917]">
                {location.event_details.host_name}
              </span>
            </p>
          ) : null}
          {uniqueAmenities.length ? (
            <div className="flex flex-wrap gap-2">
              {uniqueAmenities.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#f0ebe3] px-2.5 py-1 text-[12px] text-[#44403c]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          <p>{location.age_tags.map(ageLabel).join(" · ")}</p>
          {location.website_url ? (
            <a
              href={location.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[#ff6b6b]"
            >
              <Globe size={16} />
              Website
            </a>
          ) : null}
        </div>

        <div className="border-t border-[#f0ebe3] px-5 py-4">
          <h2 className="text-[16px] font-bold text-[#1c1917]">Reviews</h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reviewBody.trim()) return;
              onReview(reviewBody.trim(), thumbsUp);
              setReviewBody("");
            }}
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setThumbsUp(true)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium",
                  thumbsUp ? "bg-[#22c55e] text-white" : "bg-[#f0ebe3] text-[#78716c]",
                )}
              >
                Thumbs up
              </button>
              <button
                type="button"
                onClick={() => setThumbsUp(false)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium",
                  !thumbsUp ? "bg-[#ff6b6b] text-white" : "bg-[#f0ebe3] text-[#78716c]",
                )}
              >
                Thumbs down
              </button>
            </div>
            <textarea
              value={reviewBody}
              onChange={(event) => setReviewBody(event.target.value)}
              placeholder="Write a review for other parents"
              className="h-20 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px] text-[#1c1917] outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#1c1917] px-4 py-2 text-[13px] font-semibold text-white"
            >
              Post review
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {(location.reviews ?? []).length === 0 ? (
              <p className="text-[14px] text-[#a8a29e]">No reviews yet.</p>
            ) : (
              (location.reviews ?? []).map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  mine={Boolean(currentUserId && review.user_id === currentUserId)}
                  onUpdate={onUpdateReview}
                  onDelete={onDeleteReview}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ReviewItem({
  review,
  mine,
  onUpdate,
  onDelete,
}: {
  review: LocationReview;
  mine: boolean;
  onUpdate?: (reviewId: string, body: string) => void;
  onDelete?: (reviewId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(review.body);

  return (
    <div>
      <p className="text-[14px] font-medium text-[#1c1917]">
        {review.display_name}
        <span className="ml-2 font-normal text-[#a8a29e]">
          {formatReviewDate(review.created_at)}
        </span>
        {review.status && review.status !== "visible" ? (
          <span className="ml-2 font-normal text-[#ff6b6b]">Pending</span>
        ) : null}
      </p>
      {editing ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = body.trim();
            if (next.length < 3) return;
            onUpdate?.(review.id, next);
            setEditing(false);
          }}
        >
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="h-20 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px] text-[#1c1917] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full bg-[#1c1917] px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setBody(review.body);
                setEditing(false);
              }}
              className="rounded-full bg-[#f0ebe3] px-3 py-1.5 text-[12px] font-semibold text-[#44403c]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-1 text-[14px] leading-5 text-[#44403c]">{review.body}</p>
          {mine ? (
            <div className="mt-1.5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setBody(review.body);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#78716c]"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this review?")) onDelete?.(review.id);
                }}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#ff6b6b]"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Action({
  label,
  icon,
  onClick,
  active = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[72px] flex-col items-center gap-1.5 text-[12px] font-medium"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border",
          active
            ? "border-[#ff6b6b] bg-[#fff1f1] text-[#ff6b6b]"
            : "border-[#e7e5e4] text-[#1c1917] hover:bg-[#fafaf9]",
        )}
      >
        {icon}
      </span>
      <span className={active ? "text-[#ff6b6b]" : "text-[#1c1917]"}>{label}</span>
    </button>
  );
}
