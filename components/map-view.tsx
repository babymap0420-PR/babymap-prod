"use client";

import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  ControlPosition,
  Map,
  MapControl,
  useApiLoadingStatus,
  useMap,
} from "@vis.gl/react-google-maps";
import { Locate, Minus, Plus } from "lucide-react";
import { useEffect } from "react";

import { Stars } from "@/components/stars";
import { formatEventWhen } from "@/lib/format";
import type { GeoPoint } from "@/lib/geo";
import { CATEGORY_EMOJI, type BabyEvent } from "@/types/event";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const GOOGLE_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

function FlyToSelection({ event }: { event: BabyEvent | null }) {
  const map = useMap();
  const eventId = event?.id;
  const latitude = event?.latitude;
  const longitude = event?.longitude;

  useEffect(() => {
    if (!map || !eventId || latitude == null || longitude == null) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    map.panTo({ lat: latitude, lng: longitude });
    map.setZoom(15);
    const timeoutId = window.setTimeout(() => {
      map.panBy(isDesktop ? -210 : 0, isDesktop ? 0 : -90);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [eventId, latitude, longitude, map]);

  return null;
}

function MapToolbar({ userLocation }: { userLocation: GeoPoint }) {
  const map = useMap();

  if (!map) return null;

  return (
    <MapControl position={ControlPosition.RIGHT_BOTTOM}>
      <div className="mb-5 mr-2 flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)]">
        <button
          type="button"
          aria-label="Zoom in"
          className="flex h-10 w-10 items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4]"
          onClick={() => map.setZoom((map.getZoom() ?? 13) + 1)}
        >
          <Plus size={18} />
        </button>
        <div className="h-px bg-[#dadce0]" />
        <button
          type="button"
          aria-label="Zoom out"
          className="flex h-10 w-10 items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4]"
          onClick={() => map.setZoom((map.getZoom() ?? 13) - 1)}
        >
          <Minus size={18} />
        </button>
      </div>
      <button
        type="button"
        aria-label="My location"
        onClick={() => {
          map.panTo({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          });
          map.setZoom(14);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#1a73e8] shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] hover:bg-[#f1f3f4]"
      >
        <Locate size={18} />
      </button>
      </div>
    </MapControl>
  );
}

function HoverCard({ event }: { event: BabyEvent }) {
  return (
    <div className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 w-[228px] -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)]">
      <img
        src={event.photos[0]}
        alt=""
        className="h-[112px] w-full object-cover"
      />
      <div className="px-3 py-2.5">
        <p className="truncate text-[14px] font-medium text-[#202124]">
          {event.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#5f6368]">
          <span className="font-medium text-[#188038]">
            {event.rating.toFixed(1)}
          </span>
          <Stars rating={event.rating} size="sm" />
          <span>({event.reviewCount})</span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[#5f6368]">
          {formatEventWhen(event.startsAt)}
        </p>
      </div>
    </div>
  );
}

function EventMarker({
  event,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  event: BabyEvent;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <AdvancedMarker
      position={{ lat: event.latitude, lng: event.longitude }}
      title={event.title}
      zIndex={selected ? 1000 : hovered ? 500 : 1}
      onClick={() => onSelect(event.id)}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative flex flex-col items-center">
        {hovered && !selected ? <HoverCard event={event} /> : null}
        <div
          className={`baby-pin baby-pin--${event.category}${selected ? " baby-pin--selected" : ""}`}
        >
          <span>{CATEGORY_EMOJI[event.category]}</span>
        </div>
      </div>
    </AdvancedMarker>
  );
}

function MapStatus() {
  const status = useApiLoadingStatus();

  if (status !== APILoadingStatus.AUTH_FAILURE && status !== APILoadingStatus.FAILED) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-[#e6e4e0]/90 p-6">
      <div className="max-w-md rounded-xl bg-white p-5 text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)]">
        <h2 className="text-lg font-medium">Google Maps couldn’t load</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">
          Enable the Maps JavaScript API for this key, turn on billing, and add
          HTTP referrer restrictions for <code>http://localhost:3000/*</code>.
          The Android key in Flutter may be restricted to mobile apps only.
        </p>
      </div>
    </div>
  );
}

function RecenterOnUser({ location }: { location: GeoPoint }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: location.latitude, lng: location.longitude });
    map.setZoom(14);
  }, [map, location.latitude, location.longitude]);

  return null;
}

function GoogleMapCanvas({
  events,
  userLocation,
  selectedEvent,
  hoveredEvent,
  onSelect,
  onHover,
  onMapClick,
}: {
  events: BabyEvent[];
  userLocation: GeoPoint;
  selectedEvent: BabyEvent | null;
  hoveredEvent: BabyEvent | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onMapClick: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <Map
        className="h-full w-full"
        defaultCenter={{
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        }}
        defaultZoom={14}
        mapId={GOOGLE_MAP_ID}
        disableDefaultUI
        clickableIcons={false}
        gestureHandling="greedy"
        colorScheme="LIGHT"
        onClick={() => onMapClick()}
      >
        <AdvancedMarker
          position={{
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          }}
          clickable={false}
          zIndex={0}
        >
          <div className="user-location-dot" aria-hidden>
            <span className="user-location-dot__pulse" />
            <span className="user-location-dot__core" />
          </div>
        </AdvancedMarker>
        {events.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            selected={selectedEvent?.id === event.id}
            hovered={hoveredEvent?.id === event.id}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
        <FlyToSelection event={selectedEvent} />
        <RecenterOnUser location={userLocation} />
        <MapToolbar userLocation={userLocation} />
      </Map>
      <MapStatus />
    </div>
  );
}

function MissingApiKey() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e6e4e0] p-6">
      <div className="max-w-md rounded-xl bg-white p-5 text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,.3),0_2px_6px_2px_rgba(60,64,67,.15)]">
        <h2 className="text-lg font-medium">Add a Google Maps API key</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">
          Create <code>.env.local</code> in the <code>baby-map</code> folder with
          {" "}
          <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>, then restart the dev
          server. Enable Maps JavaScript API and allow{" "}
          <code>http://localhost:3000/*</code> as an HTTP referrer.
        </p>
      </div>
    </div>
  );
}

export default function MapView({
  events,
  userLocation,
  selectedEvent,
  hoveredEvent,
  onSelect,
  onHover,
  onMapClick,
}: {
  events: BabyEvent[];
  userLocation: GeoPoint;
  selectedEvent: BabyEvent | null;
  hoveredEvent: BabyEvent | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onMapClick: () => void;
}) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MissingApiKey />;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["marker"]}>
      <GoogleMapCanvas
        events={events}
        userLocation={userLocation}
        selectedEvent={selectedEvent}
        hoveredEvent={hoveredEvent}
        onSelect={onSelect}
        onHover={onHover}
        onMapClick={onMapClick}
      />
    </APIProvider>
  );
}
