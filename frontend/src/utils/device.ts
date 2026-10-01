import { getStoredAuth } from "./auth";

const DEVICE_ID_KEY = "where_device_id";

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// 로그인 상태면 계정 기준 키를, 아니면 기기 기준 키를 즐겨찾기 식별자로 사용한다.
export function getFavoritesKey(): string {
  const auth = getStoredAuth();
  return auth ? `user_${auth.user.id}` : getDeviceId();
}
