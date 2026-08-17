import { useState } from "react";
import MapPage from "./pages/MapPage";
import ListPage from "./pages/ListPage";
import "./App.css";

function App() {
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div className="app">
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
      {view === "map" ? <MapPage /> : <ListPage />}
    </div>
  );
}

export default App;
