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
import { ArrowRight, Locate, MessageCircle, ThumbsUp } from "lucide-react";
import { useEffect, useRef } from "react";

import { categoryColor, categoryEmoji, categoryLabel } from "@/data/lookups";
import { formatDistance, formatEventPinDate, formatEventWhen } from "@/lib/format";
import { distanceMeters, type GeoPoint } from "@/lib/geo";
import { listingPhoto } from "@/lib/photos";
import type { MapLocation } from "@/types/location";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  items: MapLocation[];
};

export default function MapView({
  locations,
  userLocation,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onCombo,
  onMapClick,
  onDetails,
  showCallout = true,
  showLocateLabel = true,
}: {
  locations: MapLocation[];
  userLocation: GeoPoint;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onCombo: (items: MapLocation[]) => void;
  onMapClick: () => void;
  onDetails: (id: string) => void;
  showCallout?: boolean;
  showLocateLabel?: boolean;
}) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MissingApiKey />;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["marker", "places"]}>
      <GoogleMapCanvas
        locations={locations}
        userLocation={userLocation}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        onCombo={onCombo}
        onMapClick={onMapClick}
        onDetails={onDetails}
        showCallout={showCallout}
        showLocateLabel={showLocateLabel}
      />
    </APIProvider>
  );
}

function GoogleMapCanvas({
  locations,
  userLocation,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onCombo,
  onMapClick,
  onDetails,
  showCallout = true,
  showLocateLabel = true,
}: {
  locations: MapLocation[];
  userLocation: GeoPoint;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onCombo: (items: MapLocation[]) => void;
  onMapClick: () => void;
  onDetails: (id: string) => void;
  showCallout?: boolean;
  showLocateLabel?: boolean;
}) {
  const clusters = clusterLocations(locations);
  const pinClick = useRef(false);

  return (
    <div className="relative h-full w-full">
      <Map
        className="h-full w-full"
        defaultCenter={{
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        }}
        defaultZoom={13}
        mapId={GOOGLE_MAP_ID}
        disableDefaultUI
        clickableIcons={false}
        gestureHandling="greedy"
        colorScheme="LIGHT"
        onClick={() => {
          if (pinClick.current) {
            pinClick.current = false;
            return;
          }
          onMapClick();
        }}
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
        {clusters.map((cluster) => {
          const selected = cluster.items.some((item) => item.id === selectedId);
          const hovered = cluster.items.some((item) => item.id === hoveredId);
          return (
            <AdvancedMarker
              key={cluster.id}
              position={{ lat: cluster.latitude, lng: cluster.longitude }}
              title={cluster.items.map((item) => item.name).join(", ")}
              zIndex={selected ? 1000 : hovered ? 500 : 1}
              onClick={() => {
                pinClick.current = true;
                window.setTimeout(() => {
                  pinClick.current = false;
                }, 300);
                if (cluster.items.length > 1) onCombo(cluster.items);
                else onSelect(cluster.items[0].id);
              }}
              onMouseEnter={() => onHover(cluster.items[0].id)}
              onMouseLeave={() => onHover(null)}
            >
              <div className="relative flex flex-col items-center">
                {showCallout && cluster.items.some((item) => item.id === selectedId) ? (
                  <PinCallout
                    location={
                      cluster.items.find((item) => item.id === selectedId) ??
                      cluster.items[0]
                    }
                    onDetails={() => {
                      pinClick.current = true;
                      window.setTimeout(() => {
                        pinClick.current = false;
                      }, 300);
                      const active =
                        cluster.items.find((item) => item.id === selectedId) ??
                        cluster.items[0];
                      onDetails(active.id);
                    }}
                  />
                ) : null}
                <Pin cluster={cluster} selected={selected} />
              </div>
            </AdvancedMarker>
          );
        })}
        <FlyToSelection
          location={locations.find((item) => item.id === selectedId) ?? null}
        />
        <RecenterOnUser location={userLocation} />
        <MapToolbar userLocation={userLocation} showLocateLabel={showLocateLabel} />
      </Map>
      <MapStatus />
    </div>
  );
}

function PinCallout({
  location,
  onDetails,
}: {
  location: MapLocation;
  onDetails: () => void;
}) {
  const photo = listingPhoto(location.cover_photo_url, location.photo_urls);
  const distance =
    location.distance_m != null ? formatDistance(location.distance_m) : "";
  const meta =
    location.type === "event"
      ? [formatEventWhen(location.event_details?.start_datetime), categoryLabel(location.category)]
      : [distance, categoryLabel(location.category)];

  return (
    <div className="pin-callout">
      {photo ? (
        <img src={photo} alt="" className="h-[108px] w-full object-cover" />
      ) : (
        <div className="h-[108px] w-full bg-[#f0ebe3]" />
      )}
      <div className="px-3 pt-2.5 pb-3">
        <p className="flex items-center gap-1.5 truncate text-[15px] font-bold text-[#1c1917]">
          <span aria-hidden>{categoryEmoji(location.category)}</span>
          {location.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[#78716c]">
          {meta.filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#16a34a]">
              <ThumbsUp size={13} /> {location.upvote_count}
            </span>
            <span className="inline-flex items-center gap-1 text-[#78716c]">
              <MessageCircle size={13} /> {location.review_count}
            </span>
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDetails();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-[#3d9a4a] px-3 py-1 text-[13px] font-semibold text-white"
          >
            Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Pin({ cluster, selected }: { cluster: Cluster; selected: boolean }) {
  if (cluster.items.length > 1) {
    const place = cluster.items.find((item) => item.type === "place") ?? cluster.items[0];
    return (
      <div className={`kid-pin kid-pin--combo${selected ? " kid-pin--selected" : ""}`}>
        <span>{categoryEmoji(place.category)}</span>
        <span className="kid-pin__count">{cluster.items.length}</span>
      </div>
    );
  }
  const item = cluster.items[0];
  const color = categoryColor(item.category);
  if (item.type === "event") {
    return (
      <div
        className={`kid-pin kid-pin--event${selected ? " kid-pin--selected" : ""}`}
        style={{ backgroundColor: color }}
      >
        <span className="kid-pin__date">
          {formatEventPinDate(item.event_details?.start_datetime)}
        </span>
        <span className="kid-pin__emoji">{categoryEmoji(item.category)}</span>
      </div>
    );
  }
  return (
    <div
      className={`kid-pin kid-pin--place${selected ? " kid-pin--selected" : ""}`}
      style={{ backgroundColor: color }}
    >
      <span>{categoryEmoji(item.category)}</span>
    </div>
  );
}

function FlyToSelection({ location }: { location: MapLocation | null }) {
  const map = useMap();
  const id = location?.id;
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    if (!map || !id || latitude == null || longitude == null) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    map.panTo({ lat: latitude, lng: longitude });
    map.setZoom(15);
    const timeoutId = window.setTimeout(() => {
      map.panBy(isDesktop ? 0 : 0, isDesktop ? 0 : -90);
    }, 280);
    return () => window.clearTimeout(timeoutId);
  }, [id, latitude, longitude, map]);

  return null;
}

function RecenterOnUser({ location }: { location: GeoPoint }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: location.latitude, lng: location.longitude });
    map.setZoom(13);
  }, [map, location.latitude, location.longitude]);
  return null;
}

function MapToolbar({
  userLocation,
  showLocateLabel,
}: {
  userLocation: GeoPoint;
  showLocateLabel: boolean;
}) {
  const map = useMap();
  if (!map) return null;
  return (
    <>
      {showLocateLabel ? (
        <MapControl position={ControlPosition.RIGHT_TOP}>
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
            className="mt-4 mr-4 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1c1917] shadow-[0_8px_20px_rgba(28,25,23,0.12)] md:flex"
          >
            <Locate size={16} className="text-[#3d9a4a]" />
            My Location
          </button>
        </MapControl>
      ) : null}
      <MapControl position={ControlPosition.RIGHT_TOP}>
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
          className="mt-4 mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3d9a4a] shadow-[0_8px_20px_rgba(28,25,23,0.12)] md:hidden"
        >
          <Locate size={18} />
        </button>
      </MapControl>
    </>
  );
}

function MapStatus() {
  const status = useApiLoadingStatus();
  if (
    status !== APILoadingStatus.AUTH_FAILURE &&
    status !== APILoadingStatus.FAILED
  ) {
    return null;
  }
  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-[#f7f4ef]/90 p-6">
      <div className="max-w-md rounded-2xl bg-white p-5 text-[#1c1917] shadow">
        <h2 className="text-lg font-medium">Google Maps couldn’t load</h2>
        <p className="mt-2 text-sm leading-6 text-[#78716c]">
          Enable the Maps JavaScript API and Places API for this key, turn on
          billing, and allow <code>http://localhost:3000/*</code>.
        </p>
      </div>
    </div>
  );
}

function MissingApiKey() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f7f4ef] p-6">
      <div className="max-w-md rounded-2xl bg-white p-5 text-[#1c1917] shadow">
        <h2 className="text-lg font-medium">Add a Google Maps API key</h2>
        <p className="mt-2 text-sm leading-6 text-[#78716c]">
          Create <code>.env.local</code> in the frontend folder with{" "}
          <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
        </p>
      </div>
    </div>
  );
}

function clusterLocations(locations: MapLocation[]): Cluster[] {
  const clusters: Cluster[] = [];
  const used = new Set<string>();
  for (const location of locations) {
    if (used.has(location.id)) continue;
    const group = locations.filter((other) => {
      if (used.has(other.id) && other.id !== location.id) return false;
      return (
        distanceMeters(location, other) <= 15
      );
    });
    group.forEach((item) => used.add(item.id));
    clusters.push({
      id: group.map((item) => item.id).join(":"),
      latitude: group.reduce((sum, item) => sum + item.latitude, 0) / group.length,
      longitude:
        group.reduce((sum, item) => sum + item.longitude, 0) / group.length,
      items: group,
    });
  }
  return clusters;
}
