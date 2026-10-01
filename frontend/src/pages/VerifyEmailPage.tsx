import { useEffect, useState } from "react";
import { verifyEmail, getMe } from "../api/auth";
import { getStoredAuth, setStoredAuth, broadcastAuthChange } from "../utils/auth";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("잘못된 링크예요");
      return;
    }

    verifyEmail(token)
      .then(async (res) => {
        setStatus("success");
        setMessage(res.detail);

        const stored = getStoredAuth();
        if (stored) {
          try {
            const user = await getMe(stored.token);
            setStoredAuth(stored.token, user);
          } catch {
            // 세션이 다른 계정이거나 만료된 경우 무시
          }
        }
        broadcastAuthChange();
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "인증에 실패했어요");
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--text)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        {status === "loading" && <p>인증 확인 중...</p>}
        {status === "success" && (
          <>
            <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
            <p>{message}</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>이 창은 닫으셔도 돼요.</p>
          </>
        )}
        {status === "error" && (
          <>
            <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
