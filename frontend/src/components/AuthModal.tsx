import { useState } from "react";
import { login, register, socialLoginUrl } from "../api/auth";
import { getDeviceId } from "../utils/device";
import { listFavorites, addFavorite } from "../api/favorites";
import { setStoredAuth, type StoredUser } from "../utils/auth";
import "./AuthModal.css";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthed: (user: StoredUser) => void;
  // 소셜 로그인이 실패해서 돌아왔을 때 보여줄 안내 문구
  notice?: string | null;
}

export async function migrateAnonymousFavorites(userId: string) {
  const deviceId = getDeviceId();
  const favorites = await listFavorites(deviceId).catch(() => []);
  await Promise.all(
    favorites.map((f) => addFavorite(f.location_id, `user_${userId}`).catch(() => {}))
  );
}

export default function AuthModal({ open, onClose, onAuthed, notice }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setEmail("");
    setNickname("");
    setPassword("");
    setPasswordConfirm("");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (mode === "register") {
      if (!nickname.trim()) {
        setError("닉네임을 입력해주세요");
        return;
      }
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않아요");
        return;
      }
    }

    setSubmitting(true);
    try {
      const data =
        mode === "login"
          ? await login(email.trim(), password)
          : await register(email.trim(), nickname.trim(), password);
      setStoredAuth(data.access_token, data.user);
      await migrateAnonymousFavorites(data.user.id);
      onAuthed(data.user);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-modal__backdrop" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__tabs">
          <button
            className={`auth-modal__tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            로그인
          </button>
          <button
            className={`auth-modal__tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            회원가입
          </button>
        </div>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-modal__input"
        />
        {mode === "register" && (
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="auth-modal__input"
          />
        )}
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleSubmit()}
          className="auth-modal__input"
        />
        {mode === "register" && (
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="auth-modal__input"
          />
        )}

        {(error ?? notice) && <p className="auth-modal__error">{error ?? notice}</p>}

        <button className="auth-modal__submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>

        <div className="auth-modal__divider"><span>또는</span></div>
        <a href={socialLoginUrl("kakao")} className="auth-modal__social auth-modal__social--kakao">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77l-.95 3.48c-.08.3.26.54.52.37l4.16-2.75c.53.07 1.06.11 1.61.11 5.52 0 10-3.58 10-8S17.52 3 12 3z" /></svg>
          카카오로 시작하기
        </a>
        <a href={socialLoginUrl("google")} className="auth-modal__social auth-modal__social--google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
          Google로 시작하기
        </a>
      </div>
    </div>
  );
}
