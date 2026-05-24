"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import "@/app/css/map.css";
import { useNotification } from "@/app/contexts/NotificationContext";

export default function LongdoMapPicker({
  onLocationSelect,
  initialLocation,
  readOnly = false,
  zoom = 15,
  height = 450,
  onMapReady,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const searchBoundRef = useRef(false);
  const lastInitialApplied = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const { notify } = useNotification();
  const src = `https://api.longdo.com/map/?key=${process.env.NEXT_PUBLIC_LONGDO_KEY}`;

  const parseLocation = (loc) => {
    if (!loc) return null;
    const parts = String(loc)
      .split(",")
      .map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return { lat: parts[0], lon: parts[1] };
    }
    return null;
  };

  const setMarker = (map, p) => {
    if (!map || !p) return;
    try {
      if (markerRef.current) {
        try {
          map.Overlays.remove(markerRef.current);
        } catch (e) {}
        markerRef.current = null;
      }
      const m = new window.longdo.Marker(p);
      map.Overlays.add(m);
      markerRef.current = m;
    } catch (err) {
      console.error("setMarker error", err);
    }
  };

  const emitLocation = (p) => {
    const locStr = `${p.lat},${p.lon}`;
    try {
      onLocationSelect?.(locStr);
    } catch (e) {
      console.error("onLocationSelect callback error", e);
    }
  };

  const initMap = () => {
    if (!window.longdo || !mapRef.current || mapInstance.current) return;
    const map = new window.longdo.Map({ placeholder: mapRef.current, zoom });
    map.Ui.Crosshair.visible(false);
    mapInstance.current = map;

    if (!readOnly) {
      map.Event.bind("click", (evt) => {
        const p =
          evt?.location || map.location(window.longdo.LocationMode.Pointer);
        if (!p) return;
        setMarker(map, p);
        emitLocation(p);
      });
    }

    if (!searchBoundRef.current && !readOnly) {
      map.Event.bind("search", (result) => {
        if (result?.data?.length) {
          setSearchResults(result.data);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      });
      searchBoundRef.current = true;
    }

    const initP = parseLocation(initialLocation);
    if (initP) {
      try {
        map.location(initP, true);
      } catch (e) {
        console.warn("initial map.location failed", e);
      }
      setMarker(map, initP);
      lastInitialApplied.current = `${initP.lat},${initP.lon}`;
    } else if (!readOnly && navigator.geolocation && !initialLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          try {
            map.location(p, true);
            setMarker(map, p);
          } catch (err) {
            console.warn("auto geolocate location fail", err);
          }
        },
        () => {},
        { maximumAge: 60000 }
      );
    }

    setTimeout(() => {
      try {
        map.resize();
        if (onMapReady) {
          onMapReady();
        }
      } catch (e) {}
    }, 150);
  };

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const p = parseLocation(initialLocation);
    if (!p) return;
    const key = `${p.lat},${p.lon}`;
    if (lastInitialApplied.current === key) return;
    try {
      map.location(p, true);
    } catch (e) {
      console.warn("map.location (update) failed", e);
    }
    setMarker(map, p);
    lastInitialApplied.current = key;
  }, [initialLocation]);

  const handleSearch = (keyword = searchKeyword) => {
    if (readOnly) return;
    const map = mapInstance.current;
    if (!map || !map.Search) return;
    const term = String(keyword || "").trim();
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      map.Search.search(term, { limit: 10 });
    } catch (err) {
      console.error("search error", err);
    }
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setSearchKeyword(v);
    if (v.length > 1) handleSearch(v);
    else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectPlace = (place) => {
    if (readOnly) return;
    const map = mapInstance.current;
    if (!map || !place) return;
    const p = { lat: place.lat, lon: place.lon };
    try {
      map.location(p, true);
      setMarker(map, p);
      emitLocation(p);
    } catch (err) {
      console.error("selectPlace error", err);
    }
    setSearchKeyword(place.name || "");
    setShowDropdown(false);
  };

  const getCurrentLocation = () => {
    if (readOnly) return;
    if (!navigator.geolocation) {
      notify("เบราว์เซอร์ไม่รองรับการหาตำแหน่ง", "error");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const map = mapInstance.current;
        if (map) {
          try {
            map.location(p, true);
            setMarker(map, p);
            emitLocation(p);
          } catch (err) {
            console.error("getCurrentLocation marker error", err);
          }
        }
        setIsGettingLocation(false);
      },
      (err) => {
        console.error("geolocation error", err);
        notify("ไม่สามารถหาตำแหน่งได้", "error");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (scriptReady && window.longdo && !mapInstance.current) {
      initMap();
    }
  }, [scriptReady]);

  return (
    <div className="map-wrapper" style={{ position: "relative" }}>
      <Script
        src={src}
        strategy="afterInteractive"
        onReady={() => {
          setScriptReady(true);
          if (window.longdo && !mapInstance.current) initMap();
        }}
        onLoad={() => {
          setScriptReady(true);
          if (window.longdo && !mapInstance.current) initMap();
        }}
      />

      {!readOnly && (
        <div className="map-search-bar">
          <div className="map-search-group">
            <input
              type="text"
              value={searchKeyword}
              placeholder="ค้นหาสถานที่..."
              className="map-search-input"
              onChange={handleInputChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              aria-label="ค้นหาสถานที่"
              disabled={readOnly}
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="search-dropdown" role="listbox">
                {searchResults.map((place, i) => (
                  <div
                    key={i}
                    className="dropdown-item"
                    onClick={() => selectPlace(place)}
                    role="option"
                    tabIndex={0}
                  >
                    <div className="place-name">{place.name}</div>
                    {place.address && (
                      <div className="place-address">{place.address}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || readOnly}
            className="map-current-btn"
            aria-busy={isGettingLocation}
          >
            {isGettingLocation ? "กำลังหา..." : "ใช้ตำแหน่งของฉัน"}
          </button>
        </div>
      )}

      <div
        ref={mapRef}
        className="map-container"
        aria-label="Longdo map"
        style={{ width: "100%", height: `${height}px` }}
      />
    </div>
  );
}
