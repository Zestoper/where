import { useEffect, useRef, useState } from "react";
import { searchLocation, type SearchResult } from "../api/search";
import "./SearchBar.css";

interface SearchBarProps {
  active: boolean;
  onSelect: (lat: number, lng: number, address: string) => void;
}

export default function SearchBar({ active, onSelect }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleCollapse = () => {
    setExpanded(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchLocation(query.trim());
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(runSearch, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result.lat, result.lng, result.address);
    handleCollapse();
  };

  return (
    <div className="search-bar-wrap">
      <div
        className={`search-bar ${expanded ? "expanded" : ""} ${active ? "has-selection" : ""}`}
        onClick={!expanded ? handleExpand : undefined}
      >
        <div className="search-bar__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="장소 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          className="search-bar__input"
        />
        {expanded && (
          <button className="search-bar__close" onClick={handleCollapse}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {expanded && (loading || results.length > 0) && (
        <div className="search-bar__results">
          {loading && <div className="search-bar__status">검색 중...</div>}
          {!loading &&
            results.map((result, i) => (
              <button key={i} className="search-bar__result" onClick={() => handleSelect(result)}>
                {result.address}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
