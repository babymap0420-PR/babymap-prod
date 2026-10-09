"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { EVENT_CATEGORIES, PLACE_CATEGORIES, AGE_TAGS } from "@/data/lookups";
import { searchLocations, submitLocation, addReview } from "@/lib/api";
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
  | { kind: "type" }
  | { kind: "form"; type: LocationKind; prefill: Partial<FormState> };

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
  start_datetime: string;
  end_datetime: string;
  review_body: string;
  thumbs_up: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  address: "",
  website_url: "",
  category: "farms_nature",
  age_tags: [],
  cost_type: "free",
  cost_detail: "",
  latitude: null,
  longitude: null,
  google_place_id: "",
  host_name: "",
  start_datetime: "",
  end_datetime: "",
  review_body: "",
  thumbs_up: true,
};

export function AddSheet({
  userLocation,
  onClose,
  onComplete,
}: {
  userLocation: GeoPoint;
  onClose: () => void;
  onComplete: (badges: Badge[], message: string) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "search" });
  const [query, setQuery] = useState("");
  const [kidspotHits, setKidspotHits] = useState<MapLocation[]>([]);
  const [googleHits, setGoogleHits] = useState<GooglePrediction[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
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
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[18px] font-bold text-[#1c1917]">Add a spot</h2>
        <button type="button" onClick={onClose} aria-label="Close add">
          <X size={18} className="text-[#78716c]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {step.kind === "search" ? (
          <div>
            <p className="text-[14px] text-[#78716c]">
              Search for a place or event...
            </p>
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
              className="mt-3 h-11 w-full rounded-full border border-[#e7e5e4] bg-[#f7f4ef] px-4 text-[15px] text-[#1c1917] outline-none"
            />
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
            {query.trim().length >= 2 && kidspotHits.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setForm({ ...emptyForm, name: query.trim() });
                  setStep({ kind: "type" });
                }}
                className="mt-4 w-full rounded-2xl bg-[#1c1917] py-3 text-[14px] font-semibold text-white"
              >
                No match found — add manually
              </button>
            ) : null}
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

        {step.kind === "type" ? (
          <div className="grid gap-3">
            <p className="text-[14px] text-[#78716c]">Pick a type</p>
            <button
              type="button"
              onClick={() => {
                setForm((current) => ({ ...current, category: "farms_nature" }));
                setStep({ kind: "form", type: "place", prefill: {} });
              }}
              className="rounded-2xl border border-[#e7e5e4] px-4 py-4 text-left"
            >
              <span className="block font-semibold text-[#1c1917]">Place</span>
              <span className="text-[13px] text-[#78716c]">
                Park, playground, library, indoor play
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setForm((current) => ({ ...current, category: "class" }));
                setStep({ kind: "form", type: "event", prefill: {} });
              }}
              className="rounded-2xl border border-[#e7e5e4] px-4 py-4 text-left"
            >
              <span className="block font-semibold text-[#1c1917]">Event</span>
              <span className="text-[13px] text-[#78716c]">
                Story time, class, workshop, seasonal
              </span>
            </button>
          </div>
        ) : null}

        {step.kind === "form" ? (
          <FormFields
            type={step.type}
            value={form}
            onChange={setForm}
            busy={busy}
            error={error}
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

  async function chooseGoogle(prediction: GooglePrediction) {
    const details = await googleDetails(prediction.place_id);
    setForm({
      ...emptyForm,
      name: query.trim() || prediction.description.split(",")[0],
      address: details.address || prediction.description,
      latitude: details.lat,
      longitude: details.lng,
      google_place_id: prediction.place_id,
    });
    setStep({ kind: "type" });
  }

  async function submitNew(type: LocationKind) {
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
    if (type === "event" && !form.start_datetime) {
      setError("Events need a start time.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await submitLocation({
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
        start_datetime: form.start_datetime
          ? new Date(form.start_datetime).toISOString()
          : null,
        end_datetime: form.end_datetime
          ? new Date(form.end_datetime).toISOString()
          : null,
        seasonal_status: "year_round",
        indoor_outdoor: type === "place" ? "outdoor" : undefined,
        review_body: form.review_body.trim(),
        thumbs_up: form.thumbs_up,
      });
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

function FormFields({
  type,
  value,
  onChange,
  busy,
  error,
  onSubmit,
}: {
  type: LocationKind;
  value: FormState;
  onChange: (value: FormState) => void;
  busy: boolean;
  error: string;
  onSubmit: () => void;
}) {
  const categories = type === "place" ? PLACE_CATEGORIES : EVENT_CATEGORIES;
  const patch = (partial: Partial<FormState>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold tracking-wide text-[#a8a29e] uppercase">
        Basic info
      </p>
      <Field
        label="Name"
        value={value.name}
        onChange={(name) => patch({ name })}
      />
      <Field
        label="Address"
        value={value.address}
        onChange={(address) => patch({ address })}
      />
      <label className="block text-[13px] font-medium text-[#1c1917]">
        Category
        <select
          value={value.category}
          onChange={(event) => patch({ category: event.target.value })}
          className="mt-1 h-11 w-full rounded-xl border border-[#e7e5e4] px-3 text-[15px]"
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={value.description}
        onChange={(event) => patch({ description: event.target.value })}
        placeholder="Description"
        className="h-20 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px]"
      />
      {type === "event" ? (
        <>
          <p className="pt-2 text-[11px] font-bold tracking-wide text-[#a8a29e] uppercase">
            Details
          </p>
          <Field
            label="Host name"
            value={value.host_name}
            onChange={(host_name) => patch({ host_name })}
          />
          <label className="block text-[13px] font-medium text-[#1c1917]">
            Starts
            <input
              type="datetime-local"
              value={value.start_datetime}
              onChange={(event) => patch({ start_datetime: event.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-[#e7e5e4] px-3 text-[15px]"
            />
          </label>
          <label className="block text-[13px] font-medium text-[#1c1917]">
            Ends
            <input
              type="datetime-local"
              value={value.end_datetime}
              onChange={(event) => patch({ end_datetime: event.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-[#e7e5e4] px-3 text-[15px]"
            />
          </label>
        </>
      ) : null}
      <p className="pt-2 text-[11px] font-bold tracking-wide text-[#a8a29e] uppercase">
        Audience & cost
      </p>
      <div className="flex flex-wrap gap-2">
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
                "rounded-full px-3 py-1 text-[12px]",
                active ? "bg-[#ff6b6b] text-white" : "bg-[#f0ebe3] text-[#44403c]",
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => patch({ cost_type: "free" })}
          className={cn(
            "rounded-full px-3 py-1 text-[12px]",
            value.cost_type === "free"
              ? "bg-[#22c55e] text-white"
              : "bg-[#f0ebe3] text-[#44403c]",
          )}
        >
          Free
        </button>
        <button
          type="button"
          onClick={() => patch({ cost_type: "paid" })}
          className={cn(
            "rounded-full px-3 py-1 text-[12px]",
            value.cost_type === "paid"
              ? "bg-[#1c1917] text-white"
              : "bg-[#f0ebe3] text-[#44403c]",
          )}
        >
          Paid
        </button>
      </div>
      {value.cost_type === "paid" ? (
        <Field
          label="Price detail"
          value={value.cost_detail}
          onChange={(cost_detail) => patch({ cost_detail })}
        />
      ) : null}
      <Field
        label="Website"
        value={value.website_url}
        onChange={(website_url) => patch({ website_url })}
      />
      <p className="pt-2 text-[11px] font-bold tracking-wide text-[#a8a29e] uppercase">
        Your review
      </p>
      <textarea
        value={value.review_body}
        onChange={(event) => patch({ review_body: event.target.value })}
        placeholder="Your first review (optional)"
        className="h-20 w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-[14px]"
      />
      {error ? <p className="text-[13px] text-[#ff6b6b]">{error}</p> : null}
      <div className="sticky bottom-0 bg-white pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="w-full rounded-2xl bg-[#ff6b6b] py-3 text-[14px] font-semibold text-white disabled:opacity-60"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-[13px] font-medium text-[#1c1917]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-[#e7e5e4] px-3 text-[15px] outline-none"
      />
    </label>
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
