import { useEffect, useState } from "react";
import { fetchNearbyFacilities } from "../api/facilities";
import { listFavorites, listFavoriteLocations, addFavorite, removeFavorite } from "../api/favorites";
import { getFavoritesKey } from "../utils/device";
import type { Facility } from "../types/facility";
import "./ListPage.css";

interface ListPageProps {
  selectedCategories: string[];
  searchCenter: { lat: number; lng: number; address: string } | null;
  onReport: (facility: Facility) => void;
  authUserId: string | null;
}

export default function ListPage({ selectedCategories, searchCenter, onReport, authUserId }: ListPageProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const visibleFacilities = facilities
    .filter((facility) => selectedCategories.includes(facility.category))
    .filter((facility) => !showFavoritesOnly || favoriteIds.has(facility.id));

  useEffect(() => {
    listFavorites(getFavoritesKey()).then((favorites) =>
      setFavoriteIds(new Set(favorites.map((f) => f.location_id)))
    );
  }, [authUserId]);

  const toggleFavorite = async (facility: Facility) => {
    const deviceId = getFavoritesKey();
    const isFavorite = favoriteIds.has(facility.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFavorite ? next.delete(facility.id) : next.add(facility.id);
      return next;
    });
    if (isFavorite) {
      await removeFavorite(facility.id, deviceId);
    } else {
      await addFavorite(facility.id, deviceId);
    }
  };

  useEffect(() => {
    if (showFavoritesOnly) {
      listFavoriteLocations(getFavoritesKey()).then(setFacilities);
      return;
    }

    if (searchCenter) {
      fetchNearbyFacilities(searchCenter.lat, searchCenter.lng).then(setFacilities);
      return;
    }

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
  }, [searchCenter, showFavoritesOnly, authUserId]);

  return (
    <div className="list-page">
      <button
        className={`list-page__favorites-toggle ${showFavoritesOnly ? "active" : ""}`}
        onClick={() => setShowFavoritesOnly((prev) => !prev)}
      >
        {showFavoritesOnly ? "★ 즐겨찾기만 보는 중" : "☆ 즐겨찾기만 보기"}
      </button>
      {visibleFacilities.length === 0 && (
        <p className="list-page__empty">
          {showFavoritesOnly
            ? "즐겨찾기한 시설이 없어요"
            : facilities.length === 0
              ? "주변에서 시설을 찾고 있어요..."
              : "선택한 카테고리의 시설이 없어요"}
        </p>
      )}
      <ul className="facility-list">
        {visibleFacilities.map((facility) => (
          <li key={facility.id} className="facility-card">
            <div className="facility-card__body">
              <div className="facility-card__top">
                <span className="facility-card__name">{facility.lname}</span>
                {facility.distance !== undefined && (
                  <span className="facility-card__distance">{Math.round(facility.distance)}m</span>
                )}
              </div>
              <div className="facility-card__addr">{facility.addr}</div>
            </div>
            <div className="facility-card__actions">
              <button
                className={`facility-card__star ${favoriteIds.has(facility.id) ? "active" : ""}`}
                onClick={() => toggleFavorite(facility)}
                aria-label="즐겨찾기"
              >
                {favoriteIds.has(facility.id) ? "★" : "☆"}
              </button>
              <button className="facility-card__report" onClick={() => onReport(facility)}>
                제보
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
