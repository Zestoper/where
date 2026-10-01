const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth`;

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  email_verified: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

async function handleJson(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "요청에 실패했어요");
  }
  return response.json();
}

export async function register(email: string, nickname: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, nickname, password }),
  });
  return handleJson(response);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(response);
}

export async function getMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response);
}

export async function verifyEmail(token: string): Promise<{ detail: string }> {
  const response = await fetch(`${BASE_URL}/verify-email?token=${encodeURIComponent(token)}`, {
    method: "POST",
  });
  return handleJson(response);
}

export async function resendVerification(token: string): Promise<{ detail: string }> {
  const response = await fetch(`${BASE_URL}/resend-verification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson(response);
}
