"use client";

import { Locate, MapPin, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccountMenu } from "@/components/account-menu";
import { AddSheet } from "@/components/add-sheet";
import { ComboPicker } from "@/components/combo-picker";
import { DetailPanel } from "@/components/detail-panel";
import { FilterBar } from "@/components/filter-bar";
import { LoginModal } from "@/components/login-modal";
import { ProfileSheet } from "@/components/profile-sheet";
import { SearchBar } from "@/components/search-bar";
import { SummaryCard } from "@/components/summary-card";
import {
  flagContent,
  getLocation,
  hasSupabaseKey,
  searchLocations,
  toggleFavourite,
  upvoteLocation,
  addReview,
  updateReview,
  deleteReview,
} from "@/lib/api";
import { categoryLabel } from "@/data/lookups";
import { cn } from "@/lib/cn";
import { eventWindow, type DatePreset } from "@/lib/format";
import { listingPhoto } from "@/lib/photos";
import {
  DEFAULT_LOCATION,
  DEMO_RICHMOND_HILL,
  FALLBACK_AREA,
  JUMP_AREAS,
  distanceMeters,
  getBrowserLocation,
  reverseGeocode,
  type AreaLabel,
  type GeoPoint,
} from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import {
  clearAuthSession,
  getAppUserId,
  getDisplayName,
  hasUpvoted,
  markUpvoted,
  rememberAuthUser,
  type KidSpotAccount,
} from "@/lib/user";
import type { Badge, MapLocation, TypeTab } from "@/types/location";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#f7f4ef]" />,
});

const TOAST_MS = 4000;

type ToastTone = "success" | "error";
type ToastNotice = { message: string; tone: ToastTone };

export function MapApp() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TypeTab>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [ageTags, setAgeTags] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("default");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [userLocation, setUserLocation] = useState<GeoPoint>(DEFAULT_LOCATION);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MapLocation | null>(null);
  const [comboItems, setComboItems] = useState<MapLocation[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginContext, setLoginContext] = useState("Sign in to add a spot to KidSpot");
  const [showProfile, setShowProfile] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authAccount, setAuthAccount] = useState<KidSpotAccount | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editing, setEditing] = useState<MapLocation | null>(null);
  const [toast, setToastNotice] = useState<ToastNotice | null>(null);
  function setToast(message: string, tone: ToastTone = "success") {
    setToastNotice(message ? { message, tone } : null);
  }
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [area, setArea] = useState<AreaLabel>(FALLBACK_AREA);
  const recenterRef = useRef<(() => void) | null>(null);

  const selected = locations.find((item) => item.id === selectedId) ?? null;
  const windowRange = useMemo(
    () => eventWindow(tab === "event" ? datePreset : "default", customFrom, customTo),
    [tab, datePreset, customFrom, customTo],
  );

  const load = useCallback(async (center: GeoPoint) => {
    if (!hasSupabaseKey()) {
      setLoadError("Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local");
      return;
    }
    try {
      const results = await searchLocations({
        lat: center.latitude,
        lng: center.longitude,
        type: "all",
        categories: [],
        ageTags,
        freeOnly,
        query,
        eventFrom: windowRange.from,
        eventTo: windowRange.to,
      });
      setLocations(results);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load KidSpot");
    }
  }, [ageTags, freeOnly, query, windowRange.from, windowRange.to]);

  useEffect(() => {
    let cancelled = false;
    async function locate() {
      try {
        const point = await getBrowserLocation();
        if (!cancelled) setUserLocation(point);
      } catch {
        if (!cancelled) setUserLocation(DEFAULT_LOCATION);
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
    let cancelled = false;
    void reverseGeocode(userLocation).then((label) => {
      if (!cancelled) setArea(label);
    });
    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  useEffect(() => {
    if (isLocating) return;
    const timeoutId = window.setTimeout(() => {
      void load(userLocation);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [isLocating, load, userLocation]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) {
        if (_event === "SIGNED_OUT") clearAuthSession();
        setAuthAccount(null);
        setAuthUserId(null);
        setAccountOpen(false);
        return;
      }
      const account = rememberAuthUser(user);
      setAuthAccount(account);
      setAuthUserId(account.id);
      if (sessionStorage.getItem("kidspot_after_auth") === "add") {
        sessionStorage.removeItem("kidspot_after_auth");
        setShowLogin(false);
        setShowProfile(false);
        setDetail(null);
        setEditing(null);
        setShowAdd(true);
        setToast(`👋 Welcome, ${account.nickname || account.name}!`);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDetail(null);
        setSelectedId(null);
        setSearchOpen(false);
        setShowAdd(false);
        setShowLogin(false);
        setShowProfile(false);
        setAccountOpen(false);
        setComboItems(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToastNotice(null);
      setBadges([]);
    }, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function openDetails(id: string) {
    setComboItems(null);
    setSearchOpen(false);
    setSelectedId(id);
    try {
      const full = await getLocation(id, getAppUserId(), {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
      setDetail(full);
      setVoted((current) => ({ ...current, [id]: hasUpvoted(id) }));
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not open details", "error");
    }
  }

  const typedLocations = locations.filter((item) => {
    if (tab !== "all" && item.type !== tab) return false;
    if (categories.length === 0) return true;
    return categories.some(
      (id) => id === item.category || categoryLabel(id) === categoryLabel(item.category),
    );
  });
  const searchResults = query.trim()
    ? typedLocations.filter((item) =>
        item.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : typedLocations;
  const placeCount = locations.filter((item) => item.type === "place").length;
  const eventCount = locations.filter((item) => item.type === "event").length;
  const listPlaces = searchResults.filter((item) => item.type === "place");
  const listEvents = searchResults
    .filter((item) => item.type === "event")
    .sort((a, b) =>
      (a.event_details?.start_datetime ?? "").localeCompare(
        b.event_details?.start_datetime ?? "",
      ),
    );
  const jumpAreas =
    query.trim() && searchResults.length < 2
      ? JUMP_AREAS.filter((area) =>
          area.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];
  function nearbyEvents(place: MapLocation) {
    return locations.filter(
      (item) =>
        item.type === "event" && distanceMeters(place, item) <= 15,
    ).length;
  }
  const hubLabel =
    area.city && area.city !== FALLBACK_AREA.city
      ? `${area.city.split(",")[0]} Parent Hub`
      : "Parent Hub";
  function selectListing(id: string) {
    setSelectedId(id);
    setDetail(null);
    setSearchOpen(false);
    setComboItems(null);
    setShowAdd(false);
    setShowProfile(false);
  }

  function openAccountSignIn() {
    setAccountOpen(false);
    setLoginContext("Sign in to your KidSpot account");
    setShowLogin(true);
  }

  async function signOut() {
    setAccountOpen(false);
    clearAuthSession();
    setAuthAccount(null);
    setAuthUserId(null);
    setShowAdd(false);
    setShowProfile(false);
    setEditing(null);
    setToast("Signed out");
    try {
      await supabase.auth.signOut();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not sign out", "error");
    }
  }

  function openAdd() {
    setShowProfile(false);
    setDetail(null);
    setSearchOpen(false);
    setEditing(null);
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoginContext("Sign in to add a spot to KidSpot");
        setShowLogin(true);
        return;
      }
      setShowAdd(true);
    });
  }

  function openEdit(location: MapLocation) {
    if (!authUserId || location.submitted_by !== authUserId) {
      setToast("You can only edit spots you created.", "error");
      return;
    }
    setEditing(location);
    setShowAdd(true);
    setDetail(null);
    setShowProfile(false);
    setSearchOpen(false);
  }

  const filters = (variant: "overlay" | "sidebar") => (
    <FilterBar
      variant={variant}
      tab={tab}
      onTabChange={(next) => {
        setTab(next);
        setCategories([]);
        if (next !== "event") setDatePreset("default");
      }}
      categories={categories}
      onToggleCategory={(id) =>
        setCategories((current) =>
          current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        )
      }
      ageTags={ageTags}
      onToggleAge={(id) =>
        setAgeTags((current) =>
          current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        )
      }
      freeOnly={freeOnly}
      onToggleFree={() => setFreeOnly((value) => !value)}
      datePreset={datePreset}
      onDatePreset={setDatePreset}
      customFrom={customFrom}
      customTo={customTo}
      onCustomFrom={setCustomFrom}
      onCustomTo={setCustomTo}
      placeCount={placeCount}
      eventCount={eventCount}
    />
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      <div className="absolute inset-0 md:left-[420px]">
        <MapView
          locations={typedLocations}
          userLocation={userLocation}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={(id) => {
            setDetail(null);
            setSelectedId(id);
            setSearchOpen(false);
            setComboItems(null);
          }}
          onHover={setHoveredId}
          onCombo={(items) => {
            setDetail(null);
            setSelectedId(null);
            setComboItems(items);
          }}
          onMapClick={() => {
            setSelectedId(null);
            setDetail(null);
            setSearchOpen(false);
            setComboItems(null);
          }}
          onDetails={(id) => {
            setSelectedId(id);
            void openDetails(id);
          }}
          showCallout={!detail}
          recenterRef={recenterRef}
        />
        <div className="absolute top-4 right-4 z-[1300] hidden md:block">
          <AccountMenu
            account={authAccount}
            open={accountOpen}
            onOpenChange={setAccountOpen}
            onSignOut={() => void signOut()}
            onSignIn={openAccountSignIn}
          />
        </div>
        {isLocating ? (
          <div className="pointer-events-none absolute top-20 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm text-[#78716c] shadow">
            Finding your location…
          </div>
        ) : null}
        <div className="absolute right-4 bottom-6 z-[1200] hidden flex-col items-end gap-3 md:flex">
          {!detail ? (
            <button
              type="button"
              aria-label="My location"
              onClick={() => recenterRef.current?.()}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1c1917] shadow-[0_8px_20px_rgba(28,25,23,0.12)]"
            >
              <Locate size={16} className="text-[#3d9a4a]" />
              My Location
            </button>
          ) : null}
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-full bg-[#ff6b6b] px-5 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(255,107,107,0.4)]"
          >
            <Plus size={18} />
            Add a spot
          </button>
        </div>
        {detail ? (
          <div className="absolute top-16 right-4 bottom-4 z-[1250] hidden w-[380px] md:flex">
            <DetailPanel
              key={detail.id}
              location={detail}
              upvoted={Boolean(voted[detail.id])}
              onClose={() => setDetail(null)}
              onUpvote={() => void handleUpvote(detail)}
              onFavourite={() => void handleFavourite(detail)}
              onShare={() => {
                void navigator.clipboard?.writeText(`${detail.name} · ${detail.address}`);
                setToast("Copied share text");
              }}
              onFlag={() => void handleFlag(detail)}
              onReview={(body, rating) => void handleReview(detail, body, rating)}
              canEdit={Boolean(authUserId && detail.submitted_by === authUserId)}
              onEdit={() => openEdit(detail)}
              currentUserId={authUserId}
              onUpdateReview={(reviewId, body, rating) =>
                void handleUpdateReview(detail, reviewId, body, rating)
              }
              onDeleteReview={(reviewId) => void handleDeleteReview(detail, reviewId)}
            />
          </div>
        ) : null}
      </div>

      <aside className="absolute inset-y-0 left-0 z-[1100] hidden w-[420px] flex-col border-r border-[#f0ebe3] bg-white md:flex">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3d9a4a] text-white">
            <MapPin size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] leading-5 font-extrabold text-[#1c1917]">KidSpot</p>
            <p className="truncate text-[12px] text-[#78716c]">{hubLabel}</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <SearchBar
            variant="sidebar"
            query={query}
            onQueryChange={(value) => {
              setQuery(value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onClear={() => {
              setQuery("");
              setSearchOpen(false);
            }}
          />
        </div>
        <div className="px-3 pb-2">{filters("sidebar")}</div>
        {searchOpen && query.trim() ? (
          <div className="mx-4 mb-2 overflow-hidden rounded-2xl border border-[#f0ebe3] bg-white shadow-[0_8px_24px_rgba(28,25,23,0.08)]">
            <p className="px-3 pt-2 text-[11px] font-semibold tracking-wide text-[#a8a29e] uppercase">
              KidSpot
            </p>
            {searchResults.length === 0 ? (
              <p className="px-3 py-2 text-[13px] text-[#78716c]">No name matches.</p>
            ) : (
              searchResults.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full truncate px-3 py-2 text-left text-[14px] text-[#1c1917] hover:bg-[#fafaf9]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectListing(item.id)}
                >
                  {item.name}
                </button>
              ))
            )}
            {jumpAreas.length > 0 ? (
              <>
                <p className="px-3 pt-2 text-[11px] font-semibold tracking-wide text-[#a8a29e] uppercase">
                  Jump to Area
                </p>
                {jumpAreas.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[14px] text-[#1c1917] hover:bg-[#fafaf9]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setUserLocation(area.point);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    {area.name}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        ) : null}
        <div className="px-5 py-2">
          <p className="text-[13px] text-[#a8a29e]">
            {listPlaces.length} places · {listEvents.length} events
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {searchResults.length === 0 ? (
            <p className="px-2 py-6 text-[14px] text-[#78716c]">
              {query.trim()
                ? "No KidSpot listings match that name."
                : "No KidSpot listings nearby yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {tab !== "place" && listEvents.length > 0 ? (
                <section>
                  <p className="px-1 pb-2 text-[11px] font-semibold tracking-wide text-[#a8a29e] uppercase">
                    Upcoming events
                  </p>
                  <ul className="space-y-2">
                    {listEvents.map((item) => (
                      <li key={item.id}>
                        <SummaryCard
                          variant="list"
                          location={item}
                          selected={item.id === selectedId}
                          onHover={setHoveredId}
                          onDetails={() => selectListing(item.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {tab !== "event" && listPlaces.length > 0 ? (
                <section>
                  <p className="px-1 pb-2 text-[11px] font-semibold tracking-wide text-[#a8a29e] uppercase">
                    Places
                  </p>
                  <ul className="space-y-2">
                    {listPlaces.map((item) => (
                      <li key={item.id}>
                        <SummaryCard
                          variant="list"
                          location={item}
                          selected={item.id === selectedId}
                          nearbyEventCount={nearbyEvents(item)}
                          onHover={setHoveredId}
                          onDetails={() => selectListing(item.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
        {comboItems && !detail ? (
          <div className="px-3 pb-3">
            <ComboPicker
              names={comboItems.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
              }))}
              onPick={(id) => selectListing(id)}
              onClose={() => setComboItems(null)}
            />
          </div>
        ) : null}
      </aside>

      <div
        className={cn(
          "pointer-events-none absolute z-[1100] flex flex-col gap-3 md:hidden",
          "top-3 right-3 left-3",
          showProfile ? "bottom-0" : "",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchBar
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onClear={() => {
                setQuery("");
                setSearchOpen(false);
              }}
            />
          </div>
          <AccountMenu
            account={authAccount}
            open={accountOpen}
            onOpenChange={setAccountOpen}
            onSignOut={() => void signOut()}
            onSignIn={openAccountSignIn}
          />
        </div>

        <div className="pointer-events-auto">{filters("overlay")}</div>

        {searchOpen && !detail && !showAdd && !showProfile ? (
          <div className="pointer-events-auto max-h-[min(42vh,360px)] overflow-y-auto rounded-2xl bg-white shadow-[0_12px_32px_rgba(28,25,23,0.14)]">
            <p className="px-4 py-2 text-[12px] font-semibold tracking-wide text-[#a8a29e] uppercase">
              {query.trim() ? `${searchResults.length} matches` : "Nearby"}
            </p>
            {searchResults.length === 0 ? (
              <p className="px-4 pb-4 text-[14px] text-[#78716c]">
                No KidSpot listings match that name.
              </p>
            ) : (
              <ul>
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSelectedId(item.id);
                        setSearchOpen(false);
                        setComboItems(null);
                        setDetail(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fafaf9]"
                    >
                      <img
                        src={listingPhoto(item.cover_photo_url, item.photo_urls)}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-[#1c1917]">
                          {item.name}
                        </span>
                        <span className="text-[12px] text-[#a8a29e]">
                          {item.type === "event" ? "Event" : "Place"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {comboItems && !detail ? (
          <ComboPicker
            names={comboItems.map((item) => ({
              id: item.id,
              name: item.name,
              type: item.type,
            }))}
            onPick={(id) => {
              setSelectedId(id);
              setComboItems(null);
            }}
            onClose={() => setComboItems(null)}
          />
        ) : null}

        {showProfile ? <ProfileSheet onClose={() => setShowProfile(false)} /> : null}
      </div>

      {detail ? (
        <div className="absolute inset-0 z-[1600] flex flex-col bg-white md:hidden">
          <DetailPanel
            key={detail.id}
            location={detail}
            upvoted={Boolean(voted[detail.id])}
            onClose={() => setDetail(null)}
            onUpvote={() => void handleUpvote(detail)}
            onFavourite={() => void handleFavourite(detail)}
            onShare={() => {
              void navigator.clipboard?.writeText(`${detail.name} · ${detail.address}`);
              setToast("Copied share text");
            }}
            onFlag={() => void handleFlag(detail)}
            onReview={(body, rating) => void handleReview(detail, body, rating)}
            canEdit={Boolean(authUserId && detail.submitted_by === authUserId)}
            onEdit={() => openEdit(detail)}
            currentUserId={authUserId}
            onUpdateReview={(reviewId, body, rating) =>
              void handleUpdateReview(detail, reviewId, body, rating)
            }
            onDeleteReview={(reviewId) => void handleDeleteReview(detail, reviewId)}
          />
        </div>
      ) : null}

      {showAdd ? (
        <div className="absolute inset-0 z-[1600] flex bg-black/35 p-0 md:items-center md:justify-center md:bg-black/25 md:p-6">
          <div className="flex h-full min-h-0 w-full flex-col md:h-auto md:max-h-[min(88dvh,720px)] md:max-w-xl">
            <AddSheet
              key={editing?.id ?? "create"}
              userLocation={userLocation}
              editing={editing}
              onClose={() => {
                setShowAdd(false);
                setEditing(null);
              }}
              onComplete={(earned, message) => {
                setShowAdd(false);
                setEditing(null);
                setBadges(earned);
                setToast(message);
                void load(userLocation);
              }}
            />
          </div>
        </div>
      ) : null}

      {showProfile ? (
        <div className="absolute inset-0 z-[1400] hidden items-center justify-center bg-black/25 p-6 md:flex">
          <div className="w-full max-w-lg">
            <ProfileSheet onClose={() => setShowProfile(false)} />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute right-4 bottom-6 z-[1200] flex flex-col items-end gap-3 md:hidden",
          (showAdd || detail) && "hidden",
        )}
      >
        <button
          type="button"
          aria-label="My location"
          onClick={() => recenterRef.current?.()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3d9a4a] shadow-[0_8px_20px_rgba(28,25,23,0.12)]"
        >
          <Locate size={18} />
        </button>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-full bg-[#ff6b6b] px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(255,107,107,0.45)]"
        >
          <Plus size={18} />
          Add a spot
        </button>
      </div>

      {locations.length === 0 && !isLocating && !loadError ? (
        <button
          type="button"
          onClick={() => {
            setUserLocation(DEMO_RICHMOND_HILL);
            setToast("Showing the Richmond Hill demo area from the spec");
          }}
          className="absolute bottom-24 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#1c1917] shadow md:bottom-8 md:left-[calc(420px+50%)]"
        >
          Nothing nearby — jump to demo listings
        </button>
      ) : null}

      {loadError ? (
        <div className="absolute bottom-8 left-1/2 z-[1200] max-w-sm -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center text-[13px] text-[#ff6b6b] shadow md:left-[calc(420px+50%)]">
          <p>{loadError}</p>
          <button
            type="button"
            className="mt-2 text-[12px] font-semibold text-[#1c1917]"
            onClick={() => void load(userLocation)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {showLogin ? (
        <LoginModal
          context={loginContext}
          subtitle={hubLabel}
          onClose={() => setShowLogin(false)}
          onSuccess={(account) => {
            setAuthAccount(account);
            setAuthUserId(account.id);
            setShowLogin(false);
            setShowProfile(false);
            setDetail(null);
            setSearchOpen(false);
            setToast(`👋 Welcome, ${account.nickname || account.name}!`);
            if (loginContext.includes("add a spot")) setShowAdd(true);
          }}
        />
      ) : null}

      {toast || badges.length ? (
        <div
          role={toast?.tone === "error" ? "alert" : "status"}
          className={cn(
            "absolute top-4 right-4 z-[1800] w-[min(92vw,360px)] rounded-2xl px-4 py-3 text-white shadow-[0_12px_28px_rgba(28,25,23,0.22)]",
            toast?.tone === "error" ? "bg-[#c4312c]" : "bg-[#157a34]",
          )}
        >
          {toast ? <p className="text-[14px] leading-5">{toast.message}</p> : null}
          {badges.map((badge) => (
            <p key={badge.id} className="mt-1 text-[13px]">
              {badge.icon_url} Badge: {badge.name}
            </p>
          ))}
          <button
            type="button"
            className="mt-2 text-[12px] font-semibold text-white/90"
            onClick={() => {
              setToast("");
              setBadges([]);
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );

  async function handleUpvote(location: MapLocation) {
    if (hasUpvoted(location.id) || voted[location.id]) return;
    try {
      const result = await upvoteLocation({
        userId: getAppUserId(),
        locationId: location.id,
        displayName: getDisplayName() || undefined,
      });
      markUpvoted(location.id);
      setVoted((current) => ({ ...current, [location.id]: true }));
      setDetail({ ...location, upvote_count: result.upvote_count });
      setLocations((current) =>
        current.map((item) =>
          item.id === location.id
            ? { ...item, upvote_count: result.upvote_count }
            : item,
        ),
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not upvote", "error");
    }
  }

  async function handleFavourite(location: MapLocation) {
    try {
      const result = await toggleFavourite({
        userId: getAppUserId(),
        locationId: location.id,
        displayName: getDisplayName() || undefined,
      });
      setDetail({
        ...location,
        is_favourite: result.is_favourite,
        favourite_count: result.favourite_count,
      });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not favourite", "error");
    }
  }

  async function handleFlag(location: MapLocation) {
    const reason = window.prompt("Why are you flagging this listing?") ?? "";
    try {
      const result = await flagContent({
        userId: getAppUserId(),
        contentType: "location",
        contentId: location.id,
        reason,
      });
      setToast(
        result.resolution === "auto_hidden"
          ? "Thanks. This listing was hidden."
          : "Thanks. We’ll review this flag.",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not flag", "error");
    }
  }

  async function handleReview(location: MapLocation, body: string, rating: number) {
    try {
      const result = await addReview({
        userId: getAppUserId(),
        locationId: location.id,
        body,
        rating,
        displayName: getDisplayName() || undefined,
      });
      setBadges(result.badges ?? []);
      setToast("Review posted");
      await openDetails(location.id);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not review", "error");
    }
  }

  async function handleUpdateReview(
    location: MapLocation,
    reviewId: string,
    body: string,
    rating: number,
  ) {
    try {
      const result = await updateReview({ reviewId, body, rating });
      setToast(result.status === "visible" ? "Review updated" : "Review updated and waiting for review");
      await openDetails(location.id);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not update review", "error");
    }
  }

  async function handleDeleteReview(location: MapLocation, reviewId: string) {
    try {
      await deleteReview(reviewId);
      setToast("Review deleted");
      await openDetails(location.id);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete review", "error");
    }
  }
}
