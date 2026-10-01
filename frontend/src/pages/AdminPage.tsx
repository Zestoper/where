import { useEffect, useState } from "react";
import {
  listReports,
  approveReport,
  rejectReport,
  AdminAuthError,
  type AdminReport,
} from "../api/admin";
import { CATEGORIES } from "../constants/categories";
import "./AdminPage.css";

const ADMIN_KEY_STORAGE = "where_admin_key";

interface EditState {
  category: string;
  lname: string;
  addr: string;
  lat: string;
  lng: string;
}

function buildInitialEdit(report: AdminReport): EditState {
  return {
    category: report.location?.category ?? "toilet",
    lname: report.location?.lname ?? "",
    addr: report.location?.addr ?? "",
    lat: report.location?.lat?.toString() ?? "",
    lng: report.location?.lng?.toString() ?? "",
  };
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) ?? "");
  const [keyInput, setKeyInput] = useState("");
  const [status, setStatus] = useState("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    listReports(adminKey, status)
      .then((data) => {
        setReports(data);
        setEdits(Object.fromEntries(data.map((r) => [r.id, buildInitialEdit(r)])));
      })
      .catch((err) => {
        if (err instanceof AdminAuthError) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          setAdminKey("");
          setError("인증에 실패했어요. 키를 다시 입력해주세요.");
        } else {
          setError("불러오기에 실패했어요.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [adminKey, status]);

  const handleKeySubmit = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem(ADMIN_KEY_STORAGE, keyInput.trim());
    setAdminKey(keyInput.trim());
    setKeyInput("");
  };

  const updateEdit = (reportId: string, field: keyof EditState, value: string) => {
    setEdits((prev) => ({ ...prev, [reportId]: { ...prev[reportId], [field]: value } }));
  };

  const handleApprove = async (report: AdminReport) => {
    const edit = edits[report.id];
    const payload =
      report.report_type === "missing"
        ? {}
        : {
            category: edit.category,
            lname: edit.lname,
            addr: edit.addr,
            lat: edit.lat ? parseFloat(edit.lat) : undefined,
            lng: edit.lng ? parseFloat(edit.lng) : undefined,
          };
    await approveReport(adminKey, report.id, payload);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  const handleReject = async (report: AdminReport) => {
    await rejectReport(adminKey, report.id);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  };

  if (!adminKey) {
    return (
      <div className="admin-page admin-page--login">
        <div className="admin-login">
          <h2>어드민 로그인</h2>
          <input
            type="password"
            placeholder="ADMIN_KEY"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
          />
          <button onClick={handleKeySubmit}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>제보 관리</h2>
        <div className="admin-page__filters">
          {["pending", "reviewed", "resolved"].map((s) => (
            <button
              key={s}
              className={`admin-page__filter-btn ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s === "pending" ? "대기중" : s === "reviewed" ? "반려됨" : "승인됨"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="admin-page__error">{error}</p>}
      {loading && <p className="admin-page__status">불러오는 중...</p>}
      {!loading && reports.length === 0 && <p className="admin-page__status">제보가 없어요</p>}

      <div className="admin-report-list">
        {reports.map((report) => {
          const edit = edits[report.id];
          if (!edit) return null;
          return (
            <div key={report.id} className="admin-report-card">
              <div className="admin-report-card__meta">
                <span className="admin-report-card__type">{report.report_type}</span>
                <span>{new Date(report.created_at).toLocaleString("ko-KR")}</span>
              </div>
              {report.description && <p className="admin-report-card__desc">"{report.description}"</p>}

              {report.report_type === "missing" ? (
                <div className="admin-report-card__location">
                  <strong>{report.location?.lname}</strong>
                  <span>{report.location?.addr}</span>
                  <span className="admin-report-card__hint">승인 시 이 시설이 비활성화됩니다</span>
                </div>
              ) : (
                <div className="admin-report-card__edit">
                  {!report.location_id && <span className="admin-report-card__hint">새 시설 제안</span>}
                  <select
                    value={edit.category}
                    onChange={(e) => updateEdit(report.id, "category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="이름"
                    value={edit.lname}
                    onChange={(e) => updateEdit(report.id, "lname", e.target.value)}
                  />
                  <input
                    placeholder="주소"
                    value={edit.addr}
                    onChange={(e) => updateEdit(report.id, "addr", e.target.value)}
                  />
                  <div className="admin-report-card__coords">
                    <input
                      placeholder="위도"
                      value={edit.lat}
                      onChange={(e) => updateEdit(report.id, "lat", e.target.value)}
                    />
                    <input
                      placeholder="경도"
                      value={edit.lng}
                      onChange={(e) => updateEdit(report.id, "lng", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {status === "pending" && (
                <div className="admin-report-card__actions">
                  <button className="admin-report-card__reject" onClick={() => handleReject(report)}>
                    반려
                  </button>
                  <button className="admin-report-card__approve" onClick={() => handleApprove(report)}>
                    승인
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
