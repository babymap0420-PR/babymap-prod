"use client";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Lock,
  MapPin,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AGE_TAGS, EVENT_CATEGORIES, PLACE_CATEGORIES, categoryEmoji } from "@/data/lookups";
import { searchLocations, submitLocation, updateLocation, addReview } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { GeoPoint } from "@/lib/geo";
import { getAppUserId, getDisplayName } from "@/lib/user";
import type { Badge, LocationKind, MapLocation } from "@/types/location";

type GooglePrediction = {
  description: string;
  place_id: string;
};

type Step =
  | { kind: "search" }
  | { kind: "review"; location: MapLocation }
  | { kind: "form"; type: LocationKind };

type Recurrence = "once" | "daily" | "weekly" | "monthly" | "annually";
type LookupMode = "search" | "selected" | "manual";
type HourRow = { days: string; open: string; close: string; closed: boolean };

type FormState = {
  name: string;
  description: string;
  address: string;
  website_url: string;
  category: string;
  age_tags: string[];
  cost_type: "free" | "paid";
  cost_detail: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
  host_name: string;
  review_body: string;
  thumbs_up: boolean;
  amenities: string[];
  hours: HourRow[];
  recurrence: Recurrence;
  event_date: string;
  range_start: string;
  range_end: string;
  start_time: string;
  end_time: string;
  weekdays: number[];
  repeat_mode: "day-of-month" | "weekday-position";
  nth: "first" | "second" | "third" | "fourth" | "last";
  weekday: number;
  annual_month: number;
  venue_mode: "existing" | "new";
  venue_id: string;
  lookup: LookupMode;
};

const defaultHours: HourRow[] = [
  { days: "Mon–Fri", open: "09:00", close: "17:00", closed: false },
  { days: "Sat–Sun", open: "10:00", close: "16:00", closed: false },
];

const emptyForm: FormState = {
  name: "",
  description: "",
  address: "",
  website_url: "",
  category: "indoor_play",
  age_tags: ["toddler_1_3", "pre_k_3_5"],
  cost_type: "free",
  cost_detail: "",
  latitude: null,
  longitude: null,
  google_place_id: "",
  host_name: "",
  review_body: "",
  thumbs_up: true,
  amenities: ["stroller_friendly", "washroom"],
  hours: defaultHours,
  recurrence: "once",
  event_date: "",
  range_start: "",
  range_end: "",
  start_time: "",
  end_time: "",
  weekdays: [1],
  repeat_mode: "day-of-month",
  nth: "first",
  weekday: 6,
  annual_month: 7,
  venue_mode: "existing",
  venue_id: "",
  lookup: "search",
};

function splitLocal(value: string | null | undefined) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function formFromLocation(location: MapLocation): FormState {
  const start = splitLocal(location.event_details?.start_datetime);
  const end = splitLocal(location.event_details?.end_datetime);
  return {
    ...emptyForm,
    name: location.name,
    description: location.description ?? "",
    address: location.address,
    website_url: location.website_url ?? "",
    category: location.category,
    age_tags: location.age_tags ?? [],
    cost_type: location.cost_type,
    cost_detail: location.cost_detail ?? "",
    latitude: location.latitude,
    longitude: location.longitude,
    host_name: location.event_details?.host_name ?? "",
    amenities: location.place_details?.amenities ?? emptyForm.amenities,
    recurrence: location.event_details?.is_recurring ? "weekly" : "once",
    event_date: start.date,
    range_start: start.date,
    range_end: end.date,
    start_time: start.time,
    end_time: end.time,
    lookup: location.address ? "selected" : "search",
  };
}

export function AddSheet({
  userLocation,
  onClose,
  onComplete,
  editing = null,
}: {
  userLocation: GeoPoint;
  onClose: () => void;
  onComplete: (badges: Badge[], message: string) => void;
  editing?: MapLocation | null;
}) {
  const [step, setStep] = useState<Step>(
    editing
      ? { kind: "form", type: editing.type }
      : { kind: "search" },
  );
  const [query, setQuery] = useState("");
  const [kidspotHits, setKidspotHits] = useState<MapLocation[]>([]);
  const [googleHits, setGoogleHits] = useState<GooglePrediction[]>([]);
  const [form, setForm] = useState<FormState>(editing ? formFromLocation(editing) : emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [thumbsUp, setThumbsUp] = useState(true);

  useEffect(() => {
    if (step.kind !== "search") return;
    const q = query.trim();
    if (q.length < 2) return;
    const timeoutId = window.setTimeout(() => {
      void searchLocations({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        query: q,
        radiusM: 25000,
      })
        .then(setKidspotHits)
        .catch(() => setKidspotHits([]));
      predictGoogle(q).then(setGoogleHits);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, step.kind, userLocation.latitude, userLocation.longitude]);

  return (
    <div className="pointer-events-auto flex max-h-[min(88dvh,720px)] min-h-0 w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_16px_40px_rgba(28,25,23,0.16)]">
      <div className="flex items-center justify-between border-b border-[#f5f5f4] bg-white px-5 py-4">
        {step.kind === "form" && !editing ? (
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep({ kind: "search" })}
              aria-label="Back to search"
              className="rounded-full p-1.5 text-[#78716c] hover:bg-[#f5f5f4]"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ff6b6b] text-sm font-bold text-white">
              ✨
            </div>
            <div className="min-w-0">
              <h2 className="text-base leading-none font-extrabold text-[#1c1917]">
                Add New Spot or Event
              </h2>
              <p className="mt-1 text-[11px] font-medium text-[#a8a29e]">
                Richmond Hill Community Catalog
              </p>
            </div>
          </div>
        ) : (
          <h2 className="text-[18px] font-bold text-[#1c1917]">
            {editing ? "Edit your spot" : "Add a spot"}
          </h2>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f4] text-[#78716c] hover:bg-[#e7e5e4]"
        >
          <X size={16} />
        </button>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-5 pb-5",
          step.kind === "search" && "bg-[#fafaf9] pt-5",
          step.kind === "form" && "bg-white pt-5",
        )}
      >
        {step.kind === "search" ? (
          <div>
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                if (next.trim().length < 2) {
                  setKidspotHits([]);
                  setGoogleHits([]);
                }
              }}
              placeholder="Search for a place or event..."
              className="h-12 w-full rounded-2xl border border-[#e7e5e4] bg-white px-4 text-[15px] font-semibold text-[#1c1917] shadow-sm outline-none placeholder:font-normal placeholder:text-[#a8a29e] focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/40"
            />
            {query.trim().length === 0 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[#f5f5f4] bg-white p-5 text-center">
                  <p className="mb-2 text-3xl" aria-hidden>
                    🔍
                  </p>
                  <p className="text-sm font-extrabold text-[#44403c]">
                    Search Richmond Hill spots
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#a8a29e]">
                    Type a park, splash pad, playground, or event name.
                    <br />
                    We&apos;ll show matches from KidSpot and Google Maps.
                  </p>
                </div>
                <p className="px-1 text-xs font-bold tracking-wide text-[#a8a29e] uppercase">
                  Or add directly
                </p>
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="group flex w-full items-center justify-between rounded-2xl border border-[#e7e5e4] bg-white p-4 text-left transition-colors hover:border-[#ff6b6b]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b6b]/10 text-[#ff6b6b] transition-colors group-hover:bg-[#ff6b6b] group-hover:text-white">
                      <Plus size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-[#292524] transition-colors group-hover:text-[#ff6b6b]">
                        Add a new listing manually
                      </span>
                      <span className="block text-xs text-[#a8a29e]">
                        Park, splash pad, indoor gym, or local event
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    size={20}
                    className="text-[#d6d3d1] transition-colors group-hover:text-[#ff6b6b]"
                  />
                </button>
              </div>
            ) : (
              <>
                {kidspotHits.length ? (
                  <Section title="Found on KidSpot">
                    {kidspotHits.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => setStep({ kind: "review", location })}
                        className="block w-full truncate rounded-xl px-3 py-2 text-left hover:bg-[#fafaf9]"
                      >
                        {location.name}
                      </button>
                    ))}
                  </Section>
                ) : null}
                {googleHits.length ? (
                  <Section title="Found on Google Maps">
                    {googleHits.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onClick={() => void chooseGoogle(prediction)}
                        className="block w-full truncate rounded-xl px-3 py-2 text-left hover:bg-[#fafaf9]"
                      >
                        {prediction.description}
                      </button>
                    ))}
                  </Section>
                ) : null}
                <button
                  type="button"
                  onClick={() => openCreate({ name: query.trim() })}
                  className="group mt-4 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[#e7e5e4] bg-white p-4 text-left transition-colors hover:border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/5"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f4] text-[#78716c] transition-colors group-hover:bg-[#ff6b6b] group-hover:text-white">
                      <Plus size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#292524] transition-colors group-hover:text-[#ff6b6b]">
                        Add &quot;{query.trim()}&quot; manually
                      </span>
                      <span className="block text-xs text-[#a8a29e]">
                        Not listed above? Enter details yourself
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    size={20}
                    className="text-[#d6d3d1] transition-all group-hover:translate-x-1 group-hover:text-[#ff6b6b]"
                  />
                </button>
              </>
            )}
          </div>
        ) : null}

        {step.kind === "review" ? (
          <div>
            <p className="text-[15px] font-semibold text-[#1c1917]">
              {step.location.name}
            </p>
            <p className="mt-1 text-[13px] text-[#78716c]">
              Leave a lightweight review for this listing.
            </p>
            <div className="mt-3 flex gap-2">
              <Thumb active={thumbsUp} onClick={() => setThumbsUp(true)} label="Thumbs up" />
              <Thumb
                active={!thumbsUp}
                down
                onClick={() => setThumbsUp(false)}
                label="Thumbs down"
              />
            </div>
            <textarea
              value={reviewBody}
              onChange={(event) => setReviewBody(event.target.value)}
              className="mt-3 h-24 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px]"
              placeholder="Written review"
            />
            {error ? <p className="mt-2 text-[13px] text-[#ff6b6b]">{error}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitExistingReview(step.location.id)}
              className="mt-4 w-full rounded-2xl bg-[#ff6b6b] py-3 text-[14px] font-semibold text-white disabled:opacity-60"
            >
              Submit review
            </button>
          </div>
        ) : null}

        {step.kind === "form" ? (
          <FormFields
            type={step.type}
            value={form}
            userLocation={userLocation}
            onChange={setForm}
            onTypeChange={(next) => {
              setStep({ kind: "form", type: next });
              setForm((current) => ({
                ...current,
                category:
                  next === "place"
                    ? PLACE_CATEGORIES.some((item) => item.id === current.category)
                      ? current.category
                      : "indoor_play"
                    : EVENT_CATEGORIES.some((item) => item.id === current.category)
                      ? current.category
                      : "workshop",
              }));
            }}
            busy={busy}
            error={error}
            submitLabel={
              editing
                ? "Save changes"
                : step.type === "event"
                  ? "Publish Event ✨"
                  : "Publish Spot & Unlock Badges ✨"
            }
            showReview={!editing}
            allowTypeSwitch={!editing}
            onSubmit={() => void submitNew(step.type)}
          />
        ) : null}
      </div>
    </div>
  );

  async function submitExistingReview(locationId: string) {
    if (reviewBody.trim().length < 3) {
      setError("Write a short review first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await addReview({
        userId: getAppUserId(),
        locationId,
        body: reviewBody.trim(),
        thumbsUp,
        displayName: getDisplayName() || undefined,
      });
      onComplete(result.badges ?? [], "Thanks — your review is in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  function openCreate(partial: Partial<FormState> = {}) {
    setError("");
    setForm({ ...emptyForm, ...partial });
    setStep({ kind: "form", type: "place" });
  }

  async function chooseGoogle(prediction: GooglePrediction) {
    const details = await googleDetails(prediction.place_id);
    openCreate({
      name: query.trim() || prediction.description.split(",")[0],
      address: details.address || prediction.description,
      latitude: details.lat,
      longitude: details.lng,
      google_place_id: prediction.place_id,
      lookup: "selected",
    });
  }

  async function submitNew(type: LocationKind) {
    const start = eventStart(form, type);
    if (!form.name.trim() || !form.address.trim()) {
      setError("Name and address are required.");
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      setForm((current) => ({
        ...current,
        latitude: current.latitude ?? userLocation.latitude,
        longitude: current.longitude ?? userLocation.longitude,
      }));
    }
    if (type === "event" && !start) {
      setError("Events need a date.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        user_id: getAppUserId(),
        display_name: getDisplayName() || null,
        type,
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim() || "Address pending",
        website_url: form.website_url.trim(),
        google_place_id: form.google_place_id,
        latitude: form.latitude ?? userLocation.latitude,
        longitude: form.longitude ?? userLocation.longitude,
        age_tags: form.age_tags.length ? form.age_tags : ["toddler_1_3"],
        category: form.category,
        cost_type: form.cost_type,
        cost_detail: form.cost_detail,
        host_name: form.host_name || "Community host",
        start_datetime: start ? new Date(start).toISOString() : null,
        end_datetime: (() => {
          const end = eventEnd(form, type);
          return end ? new Date(end).toISOString() : null;
        })(),
        is_recurring: type === "event" && form.recurrence !== "once",
        venue_location_id: form.venue_id || null,
        amenities: form.amenities,
        operating_hours: expandHours(form.hours),
        fenced: form.amenities.includes("fenced"),
        parking_available: form.amenities.includes("parking"),
        seasonal_status: "year_round",
        indoor_outdoor:
          type === "place"
            ? form.category === "indoor_play"
              ? "indoor"
              : "outdoor"
            : undefined,
        review_body: form.review_body.trim(),
        thumbs_up: form.thumbs_up,
      };
      if (editing) {
        await updateLocation({ ...payload, id: editing.id });
        onComplete([], "Your changes are saved.");
        return;
      }
      const result = await submitLocation(payload);
      const message =
        result.status === "approved"
          ? "It’s on the map."
          : "Submitted for review. It will show after approval.";
      onComplete(result.badges ?? [], message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }
}

const AMENITIES = [
  { id: "stroller_friendly", label: "Stroller Friendly", emoji: "👶" },
  { id: "washroom", label: "Family Washrooms", emoji: "🚻" },
  { id: "parking", label: "Free Parking", emoji: "🅿️" },
  { id: "snack", label: "Food/Snacks Allowed", emoji: "🍎" },
  { id: "shade", label: "Shaded Seating", emoji: "☂️" },
  { id: "fenced", label: "Fully Fenced", emoji: "🧱" },
] as const;

const RECURRENCE: { id: Recurrence; label: string; emoji: string }[] = [
  { id: "once", label: "One-Time", emoji: "1️⃣" },
  { id: "daily", label: "Daily", emoji: "📅" },
  { id: "weekly", label: "Weekly", emoji: "🔁" },
  { id: "monthly", label: "Monthly", emoji: "🗓️" },
  { id: "annually", label: "Annually", emoji: "📆" },
];

const WEEKDAYS = [
  { d: 1, label: "Mon" },
  { d: 2, label: "Tue" },
  { d: 3, label: "Wed" },
  { d: 4, label: "Thu" },
  { d: 5, label: "Fri" },
  { d: 6, label: "Sat" },
  { d: 0, label: "Sun" },
];

const NTH_OPTIONS = ["first", "second", "third", "fourth", "last"] as const;
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FORM_CATEGORY_EMOJI: Record<string, string> = {
  indoor_play: "🎪",
  playgrounds: "🛝",
  libraries: "📚",
  dining: "🍽️",
  attractions: "🌟",
  community_centre: "🏛️",
  farms_nature: "🌿",
  workshop: "🎨",
  class: "🧘",
  seasonal: "🌸",
  festivals: "🎉",
  markets: "🛒",
  performances: "🎭",
};

const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-[#ff6b6b]";
const labelClass = "mb-1 block text-xs font-bold text-stone-700";
const cardClass = "space-y-3 rounded-2xl border border-stone-100 bg-white p-4";
const sectionClass = "text-xs font-black tracking-wide text-stone-400 uppercase";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseDayRange(label: string) {
  const cleaned = label.replace(/–/g, "-").replace(/\s+/g, "");
  const [start, end] = cleaned.split("-");
  const indexOf = (name: string) =>
    DAY_LABELS.findIndex((day) => day.toLowerCase().startsWith(name.toLowerCase().slice(0, 3)));
  const first = indexOf(start || label);
  if (first < 0) return [];
  if (!end) return [DAY_KEYS[first]];
  const last = indexOf(end);
  if (last < 0) return [DAY_KEYS[first]];
  const days: string[] = [];
  let cursor = first;
  for (let guard = 0; guard < 7; guard += 1) {
    days.push(DAY_KEYS[cursor]);
    if (cursor === last) break;
    cursor = (cursor + 1) % 7;
  }
  return days;
}

function expandHours(rows: HourRow[]) {
  const hours: Record<string, string> = {};
  for (const row of rows) {
    const slot = row.closed ? "closed" : `${row.open}-${row.close}`;
    for (const day of parseDayRange(row.days)) hours[day] = slot;
  }
  return hours;
}

function eventStart(form: FormState, type: LocationKind) {
  if (type !== "event") return "";
  const date = form.recurrence === "once" ? form.event_date : form.range_start;
  if (!date) return "";
  return `${date}T${form.start_time || "00:00"}`;
}

function eventEnd(form: FormState, type: LocationKind) {
  if (type !== "event") return "";
  const date =
    form.recurrence === "once" ? (form.end_time ? form.event_date : "") : form.range_end;
  if (!date) return "";
  return `${date}T${form.end_time || "23:59"}`;
}

function FormFields({
  type,
  value,
  userLocation,
  onChange,
  onTypeChange,
  busy,
  error,
  onSubmit,
  submitLabel,
  showReview,
  allowTypeSwitch,
}: {
  type: LocationKind;
  value: FormState;
  userLocation: GeoPoint;
  onChange: (value: FormState) => void;
  onTypeChange: (type: LocationKind) => void;
  busy: boolean;
  error: string;
  onSubmit: () => void;
  submitLabel: string;
  showReview: boolean;
  allowTypeSwitch: boolean;
}) {
  const patch = (partial: Partial<FormState>) => onChange({ ...value, ...partial });
  const categories = type === "place" ? PLACE_CATEGORIES : EVENT_CATEGORIES;
  const audienceStep = type === "event" ? "3." : "2.";
  const reviewStep = type === "event" ? "4." : "3.";

  return (
    <div className="space-y-5">
      {allowTypeSwitch ? (
        <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-stone-100 p-1.5">
          <button
            type="button"
            onClick={() => onTypeChange("place")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all",
              type === "place" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
            )}
          >
            <Building2 size={16} className="text-[#ff6b6b]" />
            Place (Permanent Spot)
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("event")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all",
              type === "event" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
            )}
          >
            <Ticket size={16} className="text-rose-500" />
            Event (Scheduled Date)
          </button>
        </div>
      ) : null}

      {type === "place" ? (
        <AddressLookup tone="amber" fillName value={value} userLocation={userLocation} onChange={patch} />
      ) : (
        <VenueConnection value={value} userLocation={userLocation} onChange={patch} />
      )}

      <div className={cardClass}>
        <h3 className={sectionClass}>1. {type === "event" ? "Event Info" : "Place Info"}</h3>
        {type === "place" && value.lookup === "selected" ? (
          <div>
            <p className={labelClass}>Name</p>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-100 p-2.5 text-xs font-semibold text-stone-500">
              <Lock size={12} className="shrink-0 text-stone-400" />
              <span className="truncate">{value.name}</span>
            </div>
          </div>
        ) : null}
        {type === "place" && value.lookup === "search" ? (
          <div>
            <p className={labelClass}>Name</p>
            <p className="text-[11px] text-stone-400 italic">
              Name fills automatically after address lookup above.
            </p>
          </div>
        ) : null}
        {type === "event" ? (
          <label className={labelClass}>
            Name
            <input
              required
              value={value.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="e.g. Story Time with Parents"
              className={cn(fieldClass, "mt-1")}
            />
          </label>
        ) : null}
        <label className={labelClass}>
          Category
          <select
            value={value.category}
            onChange={(event) => patch({ category: event.target.value })}
            className={cn(fieldClass, "mt-1")}
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {FORM_CATEGORY_EMOJI[item.id] ?? item.emoji} {item.label}
              </option>
            ))}
          </select>
        </label>
        {type === "event" ? (
          <label className={labelClass}>
            Organizer <span className="font-normal text-stone-400">(optional)</span>
            <input
              value={value.host_name}
              onChange={(event) => patch({ host_name: event.target.value })}
              placeholder="e.g. Richmond Hill Library, YMCA, Parent Group…"
              className={cn(fieldClass, "mt-1")}
            />
          </label>
        ) : null}
        <label className={labelClass}>
          Description
          <textarea
            rows={2}
            value={value.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder={
              type === "event"
                ? "What kind of event is this? What can parents and kids expect?"
                : "What makes this place great for kids?"
            }
            className={cn(fieldClass, "mt-1")}
          />
        </label>
        {type === "place" ? (
          <>
            <div>
              <p className="mb-1.5 text-xs font-bold text-stone-700">Amenities</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((item) => {
                  const active = value.amenities.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        patch({
                          amenities: active
                            ? value.amenities.filter((id) => id !== item.id)
                            : [...value.amenities, item.id],
                        })
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border p-2 text-left text-xs font-semibold transition-all",
                        active
                          ? "border-[#ff6b6b] bg-[#ff6b6b]/10 text-stone-900"
                          : "border-stone-200 bg-stone-50 text-stone-500",
                      )}
                    >
                      <span>{item.emoji}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className={labelClass}>
                Operating Hours <span className="font-normal text-stone-400">(optional)</span>
              </p>
              <OperatingHoursEditor rows={value.hours} onChange={(hours) => patch({ hours })} />
            </div>
          </>
        ) : null}
      </div>

      {type === "event" ? <ScheduleDetails value={value} onChange={patch} /> : null}

      <div className={cardClass}>
        <h3 className={sectionClass}>{audienceStep} Audience & Cost</h3>
        <div>
          <p className="mb-1.5 text-xs font-bold text-stone-700">Target Age Groups</p>
          <div className="flex flex-wrap gap-1.5">
            {AGE_TAGS.map((tag) => {
              const active = value.age_tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    patch({
                      age_tags: active
                        ? value.age_tags.filter((id) => id !== tag.id)
                        : [...value.age_tags, tag.id],
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                    active
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-amber-200 bg-amber-50 text-amber-900",
                  )}
                >
                  {tag.emoji} {tag.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
          <div>
            <p className="text-xs font-bold text-stone-800">Admission Fee</p>
            <p className="text-[11px] text-stone-400">Is this place/event free to attend?</p>
          </div>
          <button
            type="button"
            onClick={() => patch({ cost_type: value.cost_type === "free" ? "paid" : "free" })}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-extrabold text-white",
              value.cost_type === "free" ? "bg-green-600" : "bg-orange-500",
            )}
          >
            {value.cost_type === "free" ? "Free ✨" : "Paid Admission 🎟️"}
          </button>
        </div>
      </div>

      {showReview ? (
        <div className="space-y-2 rounded-2xl border border-stone-100 bg-white p-4">
          <h3 className={sectionClass}>{reviewStep} Your Review</h3>
          <textarea
            rows={2}
            value={value.review_body}
            onChange={(event) => patch({ review_body: event.target.value })}
            placeholder="Share your first-hand experience for local parents..."
            className={fieldClass}
          />
        </div>
      ) : null}

      {error ? <p className="text-[13px] text-[#ff6b6b]">{error}</p> : null}
      <div className="sticky bottom-0 border-t border-stone-100 bg-white pt-2 pb-1">
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="w-full rounded-2xl bg-[#ff6b6b] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#ff6b6b]/30 hover:bg-[#ff6b6b]/90 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function ScheduleDetails({
  value,
  onChange,
}: {
  value: FormState;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const dateClass = cn(fieldClass, "cursor-pointer");
  return (
    <div className={cardClass}>
      <h3 className={sectionClass}>2. Schedule Details</h3>
      <div>
        <p className="mb-2 text-xs font-bold text-stone-700">Recurring Schedule</p>
        <div className="flex flex-wrap gap-1.5">
          {RECURRENCE.map((item) => {
            const active = value.recurrence === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ recurrence: item.id })}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                  active
                    ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-600 hover:border-rose-300",
                )}
              >
                <span>{item.emoji}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      {value.recurrence === "once" ? (
        <label className={labelClass}>
          Event Date <span className="text-[10px] text-[#ff6b6b]">*</span>
          <input
            type="date"
            required
            value={value.event_date}
            onChange={(event) => onChange({ event_date: event.target.value })}
            className={cn(dateClass, "mt-1")}
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold text-stone-700">
            Starts <span className="text-[10px] text-[#ff6b6b]">*</span>
            <input
              type="date"
              required
              value={value.range_start}
              onChange={(event) => onChange({ range_start: event.target.value })}
              className={cn(dateClass, "mt-1")}
            />
          </label>
          <label className="text-[11px] font-bold text-stone-700">
            Ends <span className="font-normal text-stone-400">(optional)</span>
            <input
              type="date"
              value={value.range_end}
              onChange={(event) => onChange({ range_end: event.target.value })}
              className={cn(dateClass, "mt-1")}
            />
          </label>
        </div>
      )}
      {value.recurrence === "weekly" ? (
        <div>
          <p className="mb-2 text-xs font-bold text-stone-700">Repeats On</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const active = value.weekdays.includes(day.d);
              return (
                <button
                  key={day.d}
                  type="button"
                  onClick={() =>
                    onChange({
                      weekdays: active
                        ? value.weekdays.filter((id) => id !== day.d)
                        : [...value.weekdays, day.d],
                    })
                  }
                  className={cn(
                    "w-11 rounded-full border py-1.5 text-xs font-bold",
                    active
                      ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:border-rose-300",
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {value.recurrence === "monthly" || value.recurrence === "annually" ? (
        <RepeatOn value={value} onChange={onChange} />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-bold text-stone-700">
          Start Time <span className="font-normal text-stone-400">(optional)</span>
          <input
            type="time"
            value={value.start_time}
            onChange={(event) => onChange({ start_time: event.target.value })}
            className={cn(fieldClass, "mt-1")}
          />
        </label>
        <label className="text-[11px] font-bold text-stone-700">
          End Time <span className="font-normal text-stone-400">(optional)</span>
          <input
            type="time"
            value={value.end_time}
            onChange={(event) => onChange({ end_time: event.target.value })}
            className={cn(fieldClass, "mt-1")}
          />
        </label>
      </div>
      {value.recurrence !== "once" ? (
        <p className="-mt-1 text-[10px] text-stone-400">Start / End Time applies to every occurrence.</p>
      ) : null}
    </div>
  );
}

function RepeatOn({
  value,
  onChange,
}: {
  value: FormState;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const dayNumber = value.range_start ? Number(value.range_start.slice(8, 10)) || 1 : 1;
  const choice = (mode: FormState["repeat_mode"]) =>
    cn(
      "w-full rounded-xl border p-2.5 text-left text-xs font-semibold transition-all",
      value.repeat_mode === mode
        ? "border-rose-400 bg-rose-50 text-stone-800"
        : "border-stone-200 bg-stone-50 text-stone-500 hover:border-rose-200",
    );
  const dot = (mode: FormState["repeat_mode"]) =>
    cn(
      "h-3.5 w-3.5 shrink-0 rounded-full border-2",
      value.repeat_mode === mode ? "border-rose-600 bg-rose-600" : "border-stone-300",
    );
  const selectClass =
    "cursor-pointer rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none";

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-stone-700">Repeats On</p>
      <button type="button" onClick={() => onChange({ repeat_mode: "day-of-month" })} className={choice("day-of-month")}>
        <span className="flex items-center gap-2.5">
          <span className={dot("day-of-month")} />
          <span>
            On {value.recurrence === "annually" ? "" : "day "}
            <span className="font-extrabold text-rose-600">{dayNumber}</span>
            <span className="ml-1 font-normal text-stone-400">
              {value.recurrence === "annually" ? "(same date each year)" : "(same date each month)"}
            </span>
          </span>
        </span>
        {value.repeat_mode === "day-of-month" && value.recurrence === "annually" ? (
          <span className="mt-2 ml-6 flex flex-wrap items-center gap-2">
            <select
              value={value.annual_month}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onChange({ annual_month: Number(event.target.value) })}
              className={selectClass}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <span className="text-xs text-stone-600">{dayNumber}</span>
          </span>
        ) : null}
      </button>
      <button type="button" onClick={() => onChange({ repeat_mode: "weekday-position" })} className={choice("weekday-position")}>
        <span className="mb-2 flex items-center gap-2.5">
          <span className={dot("weekday-position")} />
          <span>On the</span>
        </span>
        {value.repeat_mode === "weekday-position" ? (
          <span className="ml-6 flex flex-wrap items-center gap-2">
            <select
              value={value.nth}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onChange({ nth: event.target.value as FormState["nth"] })}
              className={selectClass}
            >
              {NTH_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={value.weekday}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onChange({ weekday: Number(event.target.value) })}
              className={selectClass}
            >
              {WEEKDAY_NAMES.map((name, index) => (
                <option key={name} value={index}>{name}</option>
              ))}
            </select>
            {value.recurrence === "annually" ? (
              <>
                <span className="text-xs font-semibold text-stone-600">of</span>
                <select
                  value={value.annual_month}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChange({ annual_month: Number(event.target.value) })}
                  className={selectClass}
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
              </>
            ) : null}
          </span>
        ) : (
          <span className="ml-6 text-xs text-stone-400">
            {value.recurrence === "annually" ? "e.g. last Saturday of August" : "e.g. last Saturday"}
          </span>
        )}
      </button>
    </div>
  );
}

function OperatingHoursEditor({
  rows,
  onChange,
}: {
  rows: HourRow[];
  onChange: (rows: HourRow[]) => void;
}) {
  const update = (index: number, partial: Partial<HourRow>) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...partial } : row)));
  };
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2"
        >
          <input
            value={row.days}
            placeholder="Mon–Fri"
            onChange={(event) => update(index, { days: event.target.value })}
            className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#ff6b6b]"
          />
          <span className="text-[10px] text-stone-400">Open</span>
          <input
            type="time"
            value={row.open}
            disabled={row.closed}
            onChange={(event) => update(index, { open: event.target.value })}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 outline-none focus:ring-1 focus:ring-[#ff6b6b] disabled:opacity-40"
          />
          <span className="text-[10px] text-stone-400">–</span>
          <input
            type="time"
            value={row.close}
            disabled={row.closed}
            onChange={(event) => update(index, { close: event.target.value })}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 outline-none focus:ring-1 focus:ring-[#ff6b6b] disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => update(index, { closed: !row.closed })}
            className={cn(
              "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold",
              row.closed
                ? "border-stone-300 bg-stone-200 text-stone-500"
                : "border-stone-200 bg-white text-stone-400 hover:border-rose-300",
            )}
          >
            {row.closed ? "Closed" : "Open"}
          </button>
          {rows.length > 1 ? (
            <button
              type="button"
              aria-label="Remove hours row"
              onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
              className="text-stone-300 hover:text-rose-400"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...rows,
            { days: DAY_LABELS[(rows.length + 1) % 7], open: "09:00", close: "17:00", closed: false },
          ])
        }
        className="flex items-center gap-1 text-[11px] font-semibold text-[#ff6b6b] hover:underline"
      >
        <Plus size={12} /> Add hours row
      </button>
    </div>
  );
}

function AddressLookup({
  tone,
  fillName,
  value,
  userLocation,
  onChange,
}: {
  tone: "amber" | "rose";
  fillName: boolean;
  value: FormState;
  userLocation: GeoPoint;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [kidspot, setKidspot] = useState<MapLocation[]>([]);
  const [googleHits, setGoogleHits] = useState<GooglePrediction[]>([]);
  const amber = tone === "amber";

  useEffect(() => {
    if (value.lookup !== "search") return;
    const q = query.trim();
    if (q.length < 2) return;
    const timeoutId = window.setTimeout(() => {
      void searchLocations({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        query: q,
        radiusM: 25000,
      })
        .then(setKidspot)
        .catch(() => setKidspot([]));
      void predictGoogle(q).then(setGoogleHits);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, userLocation.latitude, userLocation.longitude, value.lookup]);

  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border p-4",
        amber ? "border-amber-200/80 bg-amber-50/80" : "border-rose-200/80 bg-rose-50/80",
      )}
    >
      <p className={cn("flex items-center gap-1.5 text-xs font-bold", amber ? "text-amber-900" : "text-rose-900")}>
        <MapPin size={16} className={amber ? "text-[#ff6b6b]" : "text-rose-500"} />
        {amber ? "Address Lookup" : "New address"}
      </p>
      {value.lookup === "search" ? (
        <p className={cn("text-[11px]", amber ? "text-amber-700" : "text-rose-700")}>
          Search by place name or address to auto-fill details.
        </p>
      ) : null}
      {value.lookup === "selected" ? (
        <div className="flex items-start gap-2 rounded-xl border border-green-300 bg-white px-3 py-2.5">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-stone-800">{value.name || "Selected place"}</p>
            <p className="truncate text-[11px] text-stone-500">{value.address}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange({ lookup: "search", google_place_id: "", latitude: null, longitude: null });
            }}
            className="shrink-0 text-[10px] text-stone-400 hover:text-stone-600"
          >
            Change
          </button>
        </div>
      ) : null}
      {value.lookup === "manual" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className={cn("text-[11px] font-semibold", amber ? "text-amber-700" : "text-rose-700")}>
              Entering manually
            </p>
            <button
              type="button"
              onClick={() => onChange({ lookup: "search" })}
              className="text-[10px] text-stone-400 hover:text-stone-600"
            >
              ← Back to search
            </button>
          </div>
          {fillName ? (
            <input
              value={value.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Place name (e.g. Crosby Park Playground)"
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-[#ff6b6b]"
            />
          ) : null}
          <input
            value={value.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="Full address (e.g. 123 Yonge St, Richmond Hill, ON)"
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-[#ff6b6b]"
          />
        </div>
      ) : null}
      {value.lookup === "search" ? (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-3 left-3 text-stone-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search by name or address (e.g. Mill Pond, 56 Mill St)…"
            className={cn(
              "w-full rounded-xl border bg-white py-2.5 pr-3 pl-8 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-[#ff6b6b]",
              amber ? "border-amber-200" : "border-rose-200",
            )}
          />
          {open && query.trim().length > 1 ? (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
              {googleHits.length ? (
                <div>
                  <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-black tracking-wide text-blue-600 uppercase">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-blue-100 text-[9px]">G</span>
                    Google Maps
                  </p>
                  {googleHits.map((hit) => {
                    const [title, ...rest] = hit.description.split(",");
                    return (
                      <button
                        key={hit.place_id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void pickGoogle(hit)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50"
                      >
                        <MapPin size={16} className="shrink-0 text-stone-400" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-stone-800">{title.trim()}</span>
                          {rest.length ? (
                            <span className="block truncate text-[10px] text-stone-400">{rest.join(",").trim()}</span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {kidspot.length ? (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-black tracking-wide text-stone-400 uppercase">
                    Area / Address
                  </p>
                  {kidspot.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickPlace(hit)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-stone-50"
                    >
                      <span className="text-base">{categoryEmoji(hit.category)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-stone-800">{hit.name}</span>
                        <span className="block truncate text-[10px] text-stone-400">{hit.address}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  onChange({
                    lookup: "manual",
                    name: fillName ? value.name || query.trim() : value.name,
                    address: value.address || query.trim(),
                  })
                }
                className="flex w-full items-center gap-2.5 border-t border-stone-100 px-3 py-2.5 text-left hover:bg-stone-50"
              >
                <Plus size={16} className="shrink-0 text-[#ff6b6b]" />
                <span>
                  <span className="block text-xs font-bold text-[#ff6b6b]">Can&apos;t find it? Enter manually</span>
                  <span className="block text-[10px] text-stone-400">Type the name and address yourself</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  function pickPlace(hit: MapLocation) {
    setOpen(false);
    onChange({
      lookup: "selected",
      name: fillName ? hit.name : value.name,
      address: hit.address,
      latitude: hit.latitude,
      longitude: hit.longitude,
      venue_id: fillName ? "" : hit.id,
    });
  }

  async function pickGoogle(hit: GooglePrediction) {
    const details = await googleDetails(hit.place_id);
    setOpen(false);
    onChange({
      lookup: "selected",
      name: fillName ? hit.description.split(",")[0] : value.name,
      address: details.address || hit.description,
      latitude: details.lat,
      longitude: details.lng,
      google_place_id: hit.place_id,
    });
  }
}

function NewAddressSearch({
  value,
  userLocation,
  onChange,
}: {
  value: FormState;
  userLocation: GeoPoint;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const [query, setQuery] = useState(value.address);
  const [open, setOpen] = useState(false);
  const [googleHits, setGoogleHits] = useState<GooglePrediction[]>([]);
  const [kidspot, setKidspot] = useState<MapLocation[]>([]);
  const picked = value.lookup === "selected" && Boolean(value.address);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timeoutId = window.setTimeout(() => {
      void searchLocations({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        query: q,
        radiusM: 25000,
      })
        .then(setKidspot)
        .catch(() => setKidspot([]));
      void predictGoogle(q).then(setGoogleHits);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, userLocation.latitude, userLocation.longitude]);

  const showMenu = open && query.trim().length > 1 && (googleHits.length > 0 || kidspot.length > 0);

  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute top-3 left-3 text-stone-400" />
      <input
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          onChange({
            lookup: "search",
            address: next,
            latitude: null,
            longitude: null,
            google_place_id: "",
            venue_id: "",
          });
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search by place name or address…"
        className="w-full rounded-xl border border-rose-200 bg-white py-2.5 pr-3 pl-8 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-rose-300"
      />
      {showMenu ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
          {googleHits.length ? (
            <div>
              <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-black tracking-wide text-blue-600 uppercase">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-blue-100 text-[9px]">G</span>
                Google Maps
              </p>
              {googleHits.map((hit) => {
                const [title, ...rest] = hit.description.split(",");
                return (
                  <button
                    key={hit.place_id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void pickGoogle(hit, title.trim())}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50"
                  >
                    <MapPin size={16} className="shrink-0 text-stone-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-stone-800">{title.trim()}</span>
                      {rest.length ? (
                        <span className="block truncate text-[10px] text-stone-400">{rest.join(",").trim()}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {kidspot.length ? (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-black tracking-wide text-stone-400 uppercase">
                Area / Address
              </p>
              {kidspot.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    setQuery(hit.address || hit.name);
                    onChange({
                      lookup: "selected",
                      address: hit.address || hit.name,
                      latitude: hit.latitude,
                      longitude: hit.longitude,
                    });
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-stone-50"
                >
                  <MapPin size={16} className="shrink-0 text-stone-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-stone-800">{hit.name}</span>
                    <span className="block truncate text-[10px] text-stone-400">{hit.address}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {picked ? (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
          <CheckCircle2 size={12} />
          {value.address}
        </p>
      ) : null}
      {query.trim() && !picked && !open ? (
        <p className="mt-1.5 text-[10px] text-stone-400">No matches — address will be saved as entered</p>
      ) : null}
    </div>
  );

  async function pickGoogle(hit: GooglePrediction, title: string) {
    const details = await googleDetails(hit.place_id);
    const address = details.address || hit.description;
    setOpen(false);
    setQuery(address || title);
    onChange({
      lookup: "selected",
      address,
      latitude: details.lat,
      longitude: details.lng,
      google_place_id: hit.place_id,
    });
  }
}

function VenueConnection({
  value,
  userLocation,
  onChange,
}: {
  value: FormState;
  userLocation: GeoPoint;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<MapLocation[]>([]);

  useEffect(() => {
    if (value.venue_mode !== "existing") return;
    const q = query.trim();
    const timeoutId = window.setTimeout(() => {
      void searchLocations({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        query: q.length >= 2 ? q : undefined,
        radiusM: 25000,
      })
        .then((locations) => setHits(locations.filter((item) => item.type === "place").slice(0, 6)))
        .catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, userLocation.latitude, userLocation.longitude, value.venue_mode]);

  return (
    <div className="space-y-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4">
      <p className="text-xs font-bold text-rose-900">Event Venue Connection</p>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ venue_mode: "existing", lookup: "search" })}
          className={cn(
            "flex-1 rounded-xl border py-1.5 text-xs font-bold",
            value.venue_mode === "existing"
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-rose-200 bg-white text-stone-700",
          )}
        >
          Existing Spot
        </button>
        <button
          type="button"
          onClick={() => onChange({ venue_mode: "new", venue_id: "", lookup: "search" })}
          className={cn(
            "flex-1 rounded-xl border py-1.5 text-xs font-bold",
            value.venue_mode === "new"
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-rose-200 bg-white text-stone-700",
          )}
        >
          New Address
        </button>
      </div>
      {value.venue_mode === "existing" ? (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-3 left-3 text-stone-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search KidSpot spots…"
            className="w-full rounded-xl border border-rose-200 bg-white py-2.5 pr-3 pl-8 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-rose-300"
          />
          {open && hits.length ? (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-44 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
              {hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    setQuery(hit.name);
                    onChange({
                      venue_id: hit.id,
                      address: hit.address,
                      latitude: hit.latitude,
                      longitude: hit.longitude,
                      lookup: "selected",
                    });
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-rose-50",
                    hit.id === value.venue_id && "bg-rose-50/60",
                  )}
                >
                  <span>{categoryEmoji(hit.category)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-stone-800">{hit.name}</span>
                    <span className="block truncate text-[10px] text-stone-400">{hit.address}</span>
                  </span>
                  {hit.id === value.venue_id ? (
                    <CheckCircle2 size={14} className="shrink-0 text-rose-500" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          {value.venue_id && !open ? (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
              <CheckCircle2 size={12} />
              {query || value.address} selected
            </p>
          ) : null}
        </div>
      ) : (
        <NewAddressSearch value={value} userLocation={userLocation} onChange={onChange} />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-[12px] font-semibold tracking-wide text-[#a8a29e] uppercase">
        {title}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#e7e5e4]">
        {children}
      </div>
    </div>
  );
}

function Thumb({
  active,
  onClick,
  label,
  down = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  down?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[13px] font-medium",
        active
          ? down
            ? "bg-[#ff6b6b] text-white"
            : "bg-[#22c55e] text-white"
          : "bg-[#f0ebe3] text-[#78716c]",
      )}
    >
      {label}
    </button>
  );
}

async function predictGoogle(input: string): Promise<GooglePrediction[]> {
  const google = window.google;
  if (!google?.maps?.places?.AutocompleteService) return [];
  const service = new google.maps.places.AutocompleteService();
  return new Promise((resolve) => {
    service.getPlacePredictions({ input }, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }
      resolve(
        results.slice(0, 5).map((item) => ({
          description: item.description,
          place_id: item.place_id,
        })),
      );
    });
  });
}

async function googleDetails(placeId: string) {
  const google = window.google;
  if (!google?.maps?.places?.PlacesService) {
    return { address: "", lat: null as number | null, lng: null as number | null };
  }
  const service = new google.maps.places.PlacesService(document.createElement("div"));
  return new Promise<{ address: string; lat: number | null; lng: number | null }>(
    (resolve) => {
      service.getDetails(
        { placeId, fields: ["formatted_address", "geometry"] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            resolve({ address: "", lat: null, lng: null });
            return;
          }
          resolve({
            address: place.formatted_address ?? "",
            lat: place.geometry?.location?.lat() ?? null,
            lng: place.geometry?.location?.lng() ?? null,
          });
        },
      );
    },
  );
}
