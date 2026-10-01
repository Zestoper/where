import { useEffect, useRef } from "react";
import { fetchNearbyFacilities } from "../api/facilities";
import { listFavorites, addFavorite, removeFavorite } from "../api/favorites";
import { getFavoritesKey } from "../utils/device";
import type { Facility } from "../types/facility";

declare global {
  interface Window {
    naver: any;
  }
}

interface SearchCenter {
  lat: number;
  lng: number;
  address: string;
}

export default function MapPage({
  selectedCategories,
  searchCenter,
  onReport,
  authUserId,
}: {
  selectedCategories: string[];
  searchCenter: SearchCenter | null;
  onReport: (facility: Facility) => void;
  authUserId: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const facilitiesRef = useRef<Facility[]>([]);
  const selectedCategoriesRef = useRef<string[]>(selectedCategories);
  const renderMarkersRef = useRef<() => void>(() => {});
  const initMapRef = useRef<(lat: number, lng: number) => void>(() => {});
  const searchActiveRef = useRef(false);
  const lastGpsPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const favoritesRef = useRef<Set<string>>(new Set());
  const openInfoWindowRef = useRef<any>(null);
  const onReportRef = useRef(onReport);

  useEffect(() => {
    onReportRef.current = onReport;
  }, [onReport]);

  useEffect(() => {
    listFavorites(getFavoritesKey()).then((favorites) => {
      favoritesRef.current = new Set(favorites.map((f) => f.location_id));
      renderMarkersRef.current();
    });
  }, [authUserId]);

  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
    renderMarkersRef.current();
  }, [selectedCategories]);

  useEffect(() => {
    if (searchCenter) {
      searchActiveRef.current = true;
      initMapRef.current(searchCenter.lat, searchCenter.lng);
    } else {
      searchActiveRef.current = false;
      if (lastGpsPositionRef.current) {
        initMapRef.current(lastGpsPositionRef.current.lat, lastGpsPositionRef.current.lng);
      }
    }
  }, [searchCenter]);

  useEffect(() => {
    (window as any).__whereToggleFavorite = async (id: string) => {
      const deviceId = getFavoritesKey();
      if (favoritesRef.current.has(id)) {
        favoritesRef.current.delete(id);
        await removeFavorite(id, deviceId);
      } else {
        favoritesRef.current.add(id);
        await addFavorite(id, deviceId);
      }
      renderMarkersRef.current();
    };

    (window as any).__whereReportFacility = (id: string) => {
      const facility = facilitiesRef.current.find((f) => f.id === id);
      if (facility) onReportRef.current(facility);
    };

    const clearMarkers = () => {
      if (openInfoWindowRef.current) {
        openInfoWindowRef.current.close();
        openInfoWindowRef.current = null;
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };

    const buildInfoWindowContent = (facility: Facility) => {
      const isFavorite = favoritesRef.current.has(facility.id);
      return `<div style="padding:10px; font-size:13px; min-width:170px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <strong>${facility.lname}</strong>
          <button onclick="window.__whereToggleFavorite('${facility.id}')" style="border:none;background:transparent;font-size:18px;line-height:1;cursor:pointer;color:${isFavorite ? "#f59e0b" : "#9ca3af"};">${isFavorite ? "★" : "☆"}</button>
        </div>
        <div style="color:#6b7280; margin-top:2px;">${facility.addr}</div>
        <button onclick="window.__whereReportFacility('${facility.id}')" style="margin-top:8px; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:999px; padding:3px 10px; font-size:11px; cursor:pointer;">제보</button>
      </div>`;
    };

    const renderMarkers = () => {
      const map = mapInstanceRef.current;
      if (!map) return;

      clearMarkers();
      facilitiesRef.current
        .filter((facility) => selectedCategoriesRef.current.includes(facility.category))
        .forEach((facility) => {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(facility.lat, facility.lng),
            map: map,
            title: facility.lname,
          });

          const infoWindow = new window.naver.maps.InfoWindow({
            content: buildInfoWindowContent(facility),
          });

          window.naver.maps.Event.addListener(marker, "click", () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
              openInfoWindowRef.current = null;
            } else {
              infoWindow.setContent(buildInfoWindowContent(facility));
              infoWindow.open(map, marker);
              openInfoWindowRef.current = infoWindow;
            }
          });

          markersRef.current.push(marker);
        });
    };
    renderMarkersRef.current = renderMarkers;

    const refreshMarkers = (lat: number, lng: number) => {
      fetchNearbyFacilities(lat, lng).then((facilities) => {
        facilitiesRef.current = facilities;
        renderMarkers();
      });
    };

    const initMap = (lat: number, lng: number) => {
      if (!mapRef.current) return;
      const center = new window.naver.maps.LatLng(lat, lng);

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
          center,
          zoom: 15,
        });

        window.naver.maps.Event.addListener(mapInstanceRef.current, "dragend", () => {
          const newCenter = mapInstanceRef.current.getCenter();
          refreshMarkers(newCenter.lat(), newCenter.lng());
        });
      } else {
        mapInstanceRef.current.setCenter(center);
      }

      refreshMarkers(lat, lng);
    };
    initMapRef.current = initMap;

    const startWatching = () => {
      return navigator.geolocation.watchPosition(
        (position) => {
          lastGpsPositionRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (!searchActiveRef.current) {
            initMap(position.coords.latitude, position.coords.longitude);
          }
        },
        () => {
          lastGpsPositionRef.current = { lat: 37.5665, lng: 126.978 };
          if (!searchActiveRef.current) {
            initMap(37.5665, 126.978);
          }
        }
      );
    };

    let watchId: number | null = null;

    if (window.naver) {
      watchId = startWatching();
    } else {
      const script = document.createElement("script");
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_MAP_CLIENT_ID}`;
      script.onload = () => {
        watchId = startWatching();
      };
      document.head.appendChild(script);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}
