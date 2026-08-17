"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Stars } from "@/components/stars";
import { cn } from "@/lib/cn";
import {
  formatEventHeadline,
  formatFollowers,
  googleMapsDirectionsUrl,
} from "@/lib/format";
import { CATEGORY_LABELS, type BabyEvent } from "@/types/event";

function ActionButton({
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
            ? "border-[#1967d2] bg-[#e8f0fe] text-[#1967d2]"
            : "border-[#dadce0] text-[#1a73e8] hover:bg-[#f8f9fa]",
        )}
      >
        {icon}
      </span>
      <span className={active ? "text-[#1967d2]" : "text-[#1a73e8]"}>
        {label}
      </span>
    </button>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-3">
      <span className="mt-0.5 text-[#5f6368]">{icon}</span>
      <div className="min-w-0 flex-1 text-[14px] leading-5 text-[#202124]">
        {children}
      </div>
    </div>
  );
}

export function EventDetailPanel({
  event,
  following,
  saved,
  onClose,
  onToggleFollow,
  onToggleSave,
}: {
  event: BabyEvent;
  following: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleFollow: () => void;
  onToggleSave: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photo = event.photos[photoIndex] ?? event.photos[0];
  const directions = googleMapsDirectionsUrl(event.latitude, event.longitude);
  const miniMap = `https://www.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`;

  return (
    <article className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)] md:rounded-xl">
      <div className="relative h-[214px] shrink-0 bg-[#e8eaed]">
        <img
          src={photo}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#3c4043] shadow-sm hover:bg-white"
        >
          <X size={18} />
        </button>
        {event.photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                setPhotoIndex(
                  (index) =>
                    (index - 1 + event.photos.length) % event.photos.length,
                )
              }
              className="absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3c4043] shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() =>
                setPhotoIndex((index) => (index + 1) % event.photos.length)
              }
              className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3c4043] shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {event.photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Photo ${index + 1}`}
                  onClick={() => setPhotoIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full",
                    index === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-3">
          <h1 className="text-[22px] leading-7 font-normal text-[#202124]">
            {event.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[14px] text-[#5f6368]">
            <span className="font-medium text-[#188038]">
              {event.rating.toFixed(1)}
            </span>
            <Stars rating={event.rating} />
            <span>({event.reviewCount})</span>
            <span>·</span>
            <span>{CATEGORY_LABELS[event.category]}</span>
            <span>·</span>
            <span>{event.price}</span>
          </div>
          <p className="mt-1 text-[14px] text-[#5f6368]">
            {event.ageRange} · {event.neighborhood}
          </p>
        </div>

        <div className="flex justify-around border-y border-[#eee] px-2 py-3">
          <ActionButton
            label="Directions"
            icon={<Navigation size={18} />}
            onClick={() => window.open(directions, "_blank", "noopener")}
          />
          <ActionButton
            label={saved ? "Saved" : "Save"}
            icon={<Bookmark size={18} fill={saved ? "currentColor" : "none"} />}
            active={saved}
            onClick={onToggleSave}
          />
          <ActionButton
            label={following ? "Following" : "Follow"}
            icon={<UserPlus size={18} />}
            active={following}
            onClick={onToggleFollow}
          />
          <ActionButton
            label="Share"
            icon={<Share2 size={18} />}
            onClick={() => {
              void navigator.clipboard?.writeText(
                `${event.title} · ${event.address}`,
              );
            }}
          />
        </div>

        <div className="py-1">
          <InfoRow icon={<Clock size={20} />}>
            <p className="font-medium">{formatEventHeadline(event.startsAt, event.endsAt)}</p>
            <p className="mt-0.5 text-[#5f6368]">{event.goingCount} going</p>
          </InfoRow>
          <InfoRow icon={<MapPin size={20} />}>
            <p>{event.address}</p>
            <p className="mt-0.5 text-[#5f6368]">
              {event.neighborhood}, {event.city}
            </p>
          </InfoRow>
          {event.phone ? (
            <InfoRow icon={<Phone size={20} />}>
              <a href={`tel:${event.phone}`} className="text-[#1a73e8]">
                {event.phone}
              </a>
            </InfoRow>
          ) : null}
          {event.websiteLabel ? (
            <InfoRow icon={<Globe size={20} />}>
              <span className="text-[#1a73e8]">{event.websiteLabel}</span>
            </InfoRow>
          ) : null}
          <InfoRow icon={<Users size={20} />}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {event.attendees.map((person) => (
                  <img
                    key={person.id}
                    src={person.avatarUrl}
                    alt={person.name}
                    className="h-7 w-7 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-[#5f6368]">
                {event.attendees.map((person) => person.name).join(", ")}
                {event.goingCount > event.attendees.length
                  ? ` +${event.goingCount - event.attendees.length}`
                  : ""}
              </span>
            </div>
          </InfoRow>
        </div>

        <div className="border-t border-[#eee] px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={event.host.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-[#202124]">
                {event.host.name}
              </p>
              <p className="truncate text-[13px] text-[#5f6368]">
                {event.host.handle} · {formatFollowers(event.host.followers)}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleFollow}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium",
                following
                  ? "bg-[#e8f0fe] text-[#1967d2]"
                  : "bg-[#1a73e8] text-white hover:bg-[#1557b0]",
              )}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[#5f6368]">
            {event.host.bio}
          </p>
          {following ? (
            <p className="mt-2 text-[12px] text-[#188038]">
              You’ll see new events from {event.host.name.split(" ")[0]} on the map.
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#eee] px-5 py-4">
          <h2 className="text-[16px] font-medium text-[#202124]">About</h2>
          <p className="mt-2 text-[14px] leading-6 text-[#3c4043]">
            {event.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12px] text-[#3c4043]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eee] px-5 py-4">
          <h2 className="text-[16px] font-medium text-[#202124]">Location</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#eee]">
            <iframe
              title="Event location"
              src={miniMap}
              className="h-[150px] w-full border-0"
            />
          </div>
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[13px] text-[#1a73e8]"
          >
            Open in Google Maps
          </a>
        </div>

        <div className="border-t border-[#eee] px-5 py-4 pb-6">
          <h2 className="text-[16px] font-medium text-[#202124]">Reviews</h2>
          <div className="mt-3 space-y-4">
            {event.reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <img
                  src={review.avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-[14px] font-medium text-[#202124]">
                    {review.author}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#5f6368]">
                    <Stars rating={review.rating} size="sm" />
                    <span>{review.dateLabel}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-5 text-[#3c4043]">
                    {review.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
