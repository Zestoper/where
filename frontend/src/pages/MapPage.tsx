import { useEffect, useRef } from "react";
import { fetchNearbyFacilities } from "../api/facilities";

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = (lat: number, lng: number) => {
      if (!mapRef.current) return;
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(lat, lng),
        zoom: 15,
      });

      fetchNearbyFacilities(lat, lng).then((facilities) => {
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
        });
      });
    };

    const loadMapWithLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          initMap(position.coords.latitude, position.coords.longitude);
        },
        () => {
          initMap(37.5665, 126.978);
        }
      );
    };

    if (window.naver) {
      loadMapWithLocation();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_MAP_CLIENT_ID}`;
    script.onload = loadMapWithLocation;
    document.head.appendChild(script);
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}
