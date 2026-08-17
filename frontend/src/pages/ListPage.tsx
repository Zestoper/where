import { useEffect, useState } from "react";
import { fetchNearbyFacilities } from "../api/facilities";
import type { Facility } from "../types/facility";
import "./ListPage.css";

const CATEGORY_ICON: Record<string, string> = {
  toilet: "🚻",
  smoking: "🚬",
  trash: "🗑️",
  water: "🚰",
  aed: "🚑",
};

export default function ListPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        fetchNearbyFacilities(position.coords.latitude, position.coords.longitude).then(setFacilities);
      },
      () => {
        fetchNearbyFacilities(37.5665, 126.978).then(setFacilities);
      }
    );
    return () => {
    navigator.geolocation.clearWatch(watchId);
    };
}, []);

  return (
    <div className="list-page">
      {facilities.length === 0 && <p className="list-page__empty">주변에서 시설을 찾고 있어요...</p>}
      <ul className="facility-list">
        {facilities.map((facility) => (
          <li key={facility.id} className="facility-card">
            <span className="facility-card__icon">{CATEGORY_ICON[facility.category] ?? "📍"}</span>
            <div className="facility-card__body">
              <div className="facility-card__top">
                <span className="facility-card__name">{facility.lname}</span>
                <span className="facility-card__distance">{Math.round(facility.distance)}m</span>
              </div>
              <div className="facility-card__addr">{facility.addr}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
