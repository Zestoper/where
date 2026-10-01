const TOKEN_KEY = "where_auth_token";
const USER_KEY = "where_auth_user";
const AUTH_CHANNEL = "where-auth";

export interface StoredUser {
  id: string;
  email: string;
  nickname: string;
  email_verified: boolean;
}

export interface StoredAuth {
  token: string;
  user: StoredUser;
}

export function getStoredAuth(): StoredAuth | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 이메일 인증 완료 등, 다른 탭에 즉시 알려야 하는 인증 상태 변화를 방송한다.
export function broadcastAuthChange() {
  try {
    new BroadcastChannel(AUTH_CHANNEL).postMessage("changed");
  } catch {
    // BroadcastChannel 미지원 브라우저 대비 fallback
    localStorage.setItem("where_auth_ping", Date.now().toString());
  }
}

export function subscribeAuthChange(onChange: () => void): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = () => onChange();
  } catch {
    // ignore, storage 이벤트로만 처리
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === "where_auth_ping") onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    channel?.close();
    window.removeEventListener("storage", onStorage);
  };
}
