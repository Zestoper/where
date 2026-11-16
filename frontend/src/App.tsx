import { useEffect, useState } from "react";
import MapPage from "./pages/MapPage";
import ListPage from "./pages/ListPage";
import SearchBar from "./components/SearchBar";
import ReportModal from "./components/ReportModal";
import AuthModal, { migrateAnonymousFavorites } from "./components/AuthModal";
import { CATEGORIES } from "./constants/categories";
import type { Facility } from "./types/facility";
import { getStoredAuth, setStoredAuth, clearStoredAuth, subscribeAuthChange } from "./utils/auth";
import { getMe, resendVerification } from "./api/auth";
import "./App.css";
import { MapPin, X } from "lucide-react";

interface SearchCenter {
  lat: number;
  lng: number;
  address: string;
}

function App() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["toilet"]);
  const [searchCenter, setSearchCenter] = useState<SearchCenter | null>(null);
  const [reportTarget, setReportTarget] = useState<Facility | null>(null);
  const [authUser, setAuthUser] = useState(() => getStoredAuth()?.user ?? null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [resent, setResent] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleAuthClick = () => {
    if (authUser) {
      clearStoredAuth();
      setAuthUser(null);
    } else {
      setAuthModalOpen(true);
    }
  };

  const refreshMe = () => {
    const stored = getStoredAuth();
    if (!stored) return;
    getMe(stored.token)
      .then((user) => {
        setStoredAuth(stored.token, user);
        setAuthUser(user);
      })
      .catch(() => {});
  };

  // 구글/카카오 로그인 후 백엔드가 /#oauth_token=... (성공) 또는 /?oauth_error=... (실패) 로 돌려보낸다
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("oauth_token");
    const failed = new URLSearchParams(window.location.search).get("oauth_error");
    if (!token && !failed) return;
    // 주소창에서 토큰·안내 문구를 지운다 (뒤로가기·복사로 새지 않게)
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setOauthError(failed);
      setAuthModalOpen(true);
      return;
    }
    getMe(token)
      .then(async (user) => {
        setStoredAuth(token, user);
        await migrateAnonymousFavorites(user.id);
        setAuthUser(user);
      })
      .catch(() => {
        setOauthError("로그인에 실패했어요. 다시 시도해주세요");
        setAuthModalOpen(true);
      });
  }, []);

  // 다른 탭에서 이메일 인증이 끝나면 즉시 반영
  useEffect(() => subscribeAuthChange(refreshMe), []);

  // 인증 대기 중이면 혹시 모를 누락에 대비해 주기적으로도 확인
  useEffect(() => {
    if (!authUser || authUser.email_verified) return;
    const interval = setInterval(refreshMe, 10000);
    return () => clearInterval(interval);
  }, [authUser]);

  const handleResend = () => {
    const stored = getStoredAuth();
    if (!stored) return;
    resendVerification(stored.token).then(() => {
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    });
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((category) => category !== id) : [...prev, id]
    );
  };

  return (
    <div className="app">
      <div className="auth-corner">
        <button className="auth-btn" onClick={handleAuthClick}>
          {authUser ? authUser.nickname : "로그인"}
        </button>
        {authUser && !authUser.email_verified && (
          <div className="auth-verify-banner">
            <span>이메일 인증이 필요해요</span>
            <button onClick={handleResend} disabled={resent}>
              {resent ? "전송됨" : "재전송"}
            </button>
          </div>
        )}
      </div>
      <div className="header-stack">
        <div className="top-bar">
          <SearchBar
            active={searchCenter !== null}
            onSelect={(lat, lng, address) => setSearchCenter({ lat, lng, address })}
          />
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${view === "map" ? "active" : ""}`}
              onClick={() => setView("map")}
            >
              지도로 보기
            </button>
            <button
              className={`view-toggle__btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              리스트로 보기
            </button>
          </div>
        </div>
        <div className="category-filter">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-filter__btn ${
                selectedCategories.includes(category.id) ? "active" : ""
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        {searchCenter && (
          <div className="active-search-chip">
            <span><MapPin size="1em" /> {searchCenter.address}</span>
            <button onClick={() => setSearchCenter(null)}><X size="1em" /></button>
          </div>
        )}
      </div>
      <div style={{ display: view === "map" ? "block" : "none", height: "100%" }}>
        <MapPage
          selectedCategories={selectedCategories}
          searchCenter={searchCenter}
          onReport={setReportTarget}
          authUserId={authUser?.id ?? null}
        />
      </div>
      <div style={{ display: view === "list" ? "block" : "none", height: "100%" }}>
        <ListPage
          selectedCategories={selectedCategories}
          searchCenter={searchCenter}
          onReport={setReportTarget}
          authUserId={authUser?.id ?? null}
        />
      </div>
      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
      <AuthModal
        open={authModalOpen}
        notice={oauthError}
        onClose={() => {
          setAuthModalOpen(false);
          setOauthError(null);
        }}
        onAuthed={(user) => {
          setAuthUser(user);
          setAuthModalOpen(false);
          setOauthError(null);
        }}
      />
    </div>
  );
}

export default App;
