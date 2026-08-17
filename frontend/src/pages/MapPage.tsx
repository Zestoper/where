import { useEffect, useRef } from "react";
import { fetchNearbyFacilities } from "../api/facilities";

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const clearMarkers = () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };

    const refreshMarkers = (lat: number, lng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      fetchNearbyFacilities(lat, lng).then((facilities) => {
        clearMarkers();
        facilities.forEach((facility) => {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(facility.lat, facility.lng),
            map: map,
            title: facility.lname,
          });

          const infoWindow = new window.naver.maps.InfoWindow({
            content: `<div style="padding:8px; font-size:13px;">
              <strong>${facility.lname}</strong><br/>
              ${facility.addr}
            </div>`,
          });

          window.naver.maps.Event.addListener(marker, "click", () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(map, marker);
            }
          });

          markersRef.current.push(marker);
        });
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

    const startWatching = () => {
      return navigator.geolocation.watchPosition(
        (position) => {
          initMap(position.coords.latitude, position.coords.longitude);
        },
        () => {
          initMap(37.5665, 126.978);
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
