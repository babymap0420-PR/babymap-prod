"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { EventDetailPanel } from "@/components/event-detail-panel";
import { SearchOverlay } from "@/components/search-overlay";
import { createMockEventsAround, searchEvents } from "@/data/events";
import { cn } from "@/lib/cn";
import {
  DEFAULT_LOCATION,
  FALLBACK_AREA,
  getBrowserLocation,
  reverseGeocode,
  type GeoPoint,
} from "@/lib/geo";
import type { BabyEvent, EventCategory } from "@/types/event";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#e6e4e0]" />,
});

export function MapApp() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [followedHosts, setFollowedHosts] = useState<string[]>([]);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<GeoPoint>(DEFAULT_LOCATION);
  const [events, setEvents] = useState<BabyEvent[]>(() =>
    createMockEventsAround(DEFAULT_LOCATION, FALLBACK_AREA),
  );
  const [isLocating, setIsLocating] = useState(true);

  const results = useMemo(
    () => searchEvents(events, query, category),
    [events, query, category],
  );
  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;
  const hoveredEvent = results.find((event) => event.id === hoveredId) ?? null;
  const showSearchResults =
    searchFocused || (query.trim().length > 0 && !selectedEvent);

  useEffect(() => {
    let cancelled = false;

    async function locate() {
      try {
        const point = await getBrowserLocation();
        if (cancelled) return;
        const area = await reverseGeocode(point);
        if (cancelled) return;
        setUserLocation(point);
        setEvents(createMockEventsAround(point, area));
      } catch {
        if (!cancelled) {
          setEvents(createMockEventsAround(DEFAULT_LOCATION, FALLBACK_AREA));
        }
      } finally {
        if (!cancelled) setIsLocating(false);
      }
    }

    void locate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
        setSearchFocused(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#e6e4e0]">
      <div className="absolute inset-0">
        <MapView
          events={results}
          userLocation={userLocation}
          selectedEvent={selectedEvent}
          hoveredEvent={hoveredEvent}
          onSelect={(id) => {
            setSelectedId(id);
            setSearchFocused(false);
          }}
          onHover={setHoveredId}
          onMapClick={() => {
            setSelectedId(null);
            setSearchFocused(false);
          }}
        />
        {isLocating ? (
          <div className="pointer-events-none absolute top-20 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm text-[#5f6368] shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)]">
            Finding your location…
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute z-[1100] flex flex-col gap-3",
          "top-3 right-3 left-3 md:top-4 md:left-4 md:right-auto md:w-[408px]",
          selectedEvent
            ? "bottom-0 md:bottom-4 md:max-h-[calc(100dvh-32px)]"
            : "md:max-h-[calc(100dvh-32px)]",
        )}
      >
        <SearchOverlay
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          results={results}
          selectedEventId={selectedId}
          isFocused={showSearchResults}
          onFocusChange={setSearchFocused}
          onSelect={(id) => {
            setSelectedId(id);
            setSearchFocused(false);
          }}
        />

        {selectedEvent ? (
          <div className="flex min-h-0 flex-1 md:min-h-0">
            <EventDetailPanel
              key={selectedEvent.id}
              event={selectedEvent}
              following={followedHosts.includes(selectedEvent.host.id)}
              saved={savedEvents.includes(selectedEvent.id)}
              onClose={() => setSelectedId(null)}
              onToggleFollow={() => {
                const hostId = selectedEvent.host.id;
                setFollowedHosts((current) =>
                  current.includes(hostId)
                    ? current.filter((id) => id !== hostId)
                    : [...current, hostId],
                );
              }}
              onToggleSave={() => {
                const eventId = selectedEvent.id;
                setSavedEvents((current) =>
                  current.includes(eventId)
                    ? current.filter((id) => id !== eventId)
                    : [...current, eventId],
                );
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
