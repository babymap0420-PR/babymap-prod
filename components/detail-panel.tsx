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
import { StarPicker, Stars } from "@/components/star-rating";
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
  onReview: (body: string, rating: number) => void;
  canEdit?: boolean;
  onEdit?: () => void;
  currentUserId?: string | null;
  onUpdateReview?: (reviewId: string, body: string, rating: number) => void;
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
  const [rating, setRating] = useState(0);
  const [reviewError, setReviewError] = useState("");

  return (
    <article className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:rounded-3xl md:shadow-[0_12px_40px_rgba(28,25,23,0.16)]">
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
            <span className="inline-flex items-center gap-1.5">
              {location.average_rating != null ? (
                <>
                  <Stars value={location.average_rating} size={14} />
                  <span className="font-semibold text-[#1c1917]">
                    {Number(location.average_rating).toFixed(1)}
                  </span>
                </>
              ) : null}
              <span>{location.review_count} reviews</span>
            </span>
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold text-[#1c1917]">Reviews</h2>
            {location.average_rating != null ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#78716c]">
                <Stars value={location.average_rating} size={16} />
                <span className="font-semibold text-[#1c1917]">
                  {Number(location.average_rating).toFixed(1)}
                </span>
              </span>
            ) : null}
          </div>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (rating < 1) {
                setReviewError("Choose a star rating.");
                return;
              }
              if (reviewBody.trim().length < 3) {
                setReviewError("Write a short review.");
                return;
              }
              setReviewError("");
              onReview(reviewBody.trim(), rating);
              setReviewBody("");
              setRating(0);
            }}
          >
            <div>
              <p className="mb-1 text-[13px] font-medium text-[#44403c]">Rate this spot</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <textarea
              value={reviewBody}
              onChange={(event) => setReviewBody(event.target.value)}
              placeholder="Share your experience for other parents"
              className="h-20 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px] text-[#1c1917] outline-none"
            />
            {reviewError ? <p className="text-[13px] text-[#c4312c]">{reviewError}</p> : null}
            <button
              type="submit"
              className="rounded-full bg-[#1c1917] px-4 py-2 text-[13px] font-semibold text-white"
            >
              Post review
            </button>
          </form>
          <div className="mt-5 space-y-5">
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
  onUpdate?: (reviewId: string, body: string, rating: number) => void;
  onDelete?: (reviewId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(review.body);
  const [rating, setRating] = useState(review.rating ?? 0);

  return (
    <div className="flex items-start gap-3">
      <ReviewAvatar name={review.display_name} />
      <div className="min-w-0 flex-1">
      <p className="text-[14px] leading-5 font-medium text-[#202124]">
        {review.display_name}
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
            if (rating < 1 || next.length < 3) return;
            onUpdate?.(review.id, next, rating);
            setEditing(false);
          }}
        >
          <StarPicker value={rating} onChange={setRating} size={22} />
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
                setRating(review.rating ?? 0);
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
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {review.rating ? <Stars value={review.rating} size={14} /> : null}
            <span className="text-[12px] text-[#70757a]">
              {formatReviewDate(review.created_at)}
            </span>
          </div>
          <p className="mt-2 text-[14px] leading-5 text-[#3c4043]">{review.body}</p>
          {mine ? (
            <div className="mt-1.5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setBody(review.body);
                  setRating(review.rating ?? 0);
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
    </div>
  );
}

function ReviewAvatar({ name }: { name: string }) {
  const label = name.trim() || "Parent";

  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b6b] text-[15px] font-bold text-white"
    >
      {label.charAt(0).toUpperCase()}
    </span>
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
