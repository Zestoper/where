export interface ReportPayload {
  location_id: string;
  report_type: string;
  description?: string;
}

export async function createReport(payload: ReportPayload): Promise<void> {
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
