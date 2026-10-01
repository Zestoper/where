import { useState } from "react";
import { login, register } from "../api/auth";
import { getDeviceId } from "../utils/device";
import { listFavorites, addFavorite } from "../api/favorites";
import { setStoredAuth, type StoredUser } from "../utils/auth";
import "./AuthModal.css";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthed: (user: StoredUser) => void;
}

async function migrateAnonymousFavorites(userId: string) {
  const deviceId = getDeviceId();
  const favorites = await listFavorites(deviceId).catch(() => []);
  await Promise.all(
    favorites.map((f) => addFavorite(f.location_id, `user_${userId}`).catch(() => {}))
  );
}

export default function AuthModal({ open, onClose, onAuthed }: AuthModalProps) {
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

        {error && <p className="auth-modal__error">{error}</p>}

        <button className="auth-modal__submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </div>
    </div>
  );
}
