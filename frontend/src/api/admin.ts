const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin`;

export interface AdminReportLocation {
  category: string;
  lname: string;
  addr: string;
  is_active: boolean;
  lat: number;
  lng: number;
}

export interface AdminReport {
  id: string;
  location_id: string | null;
  report_type: string;
  description: string | null;
  status: string;
  created_at: string;
  location: AdminReportLocation | null;
}

export interface ApprovePayload {
  category?: string;
  lname?: string;
  addr?: string;
  lat?: number;
  lng?: number;
}

class AdminAuthError extends Error {}

async function adminFetch(path: string, adminKey: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "X-Admin-Key": adminKey,
    },
  });
  if (response.status === 401 || response.status === 422) {
    throw new AdminAuthError("인증 실패");
  }
  return response;
}

export { AdminAuthError };

export async function listReports(adminKey: string, status?: string): Promise<AdminReport[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await adminFetch(`/reports${query}`, adminKey);
  return response.json();
}

export async function approveReport(adminKey: string, reportId: string, payload: ApprovePayload) {
  const response = await adminFetch(`/reports/${reportId}/approve`, adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function rejectReport(adminKey: string, reportId: string) {
  const response = await adminFetch(`/reports/${reportId}/reject`, adminKey, {
    method: "POST",
  });
  return response.json();
}
