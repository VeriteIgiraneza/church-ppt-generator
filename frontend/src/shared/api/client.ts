const API_BASE_URL = "http://localhost:8000";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Health check — used to verify backend is reachable
export async function checkHealth(): Promise<{ status: string }> {
  return apiGet<{ status: string }>("/api/health");
}