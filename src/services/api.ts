const localApiUrl = ["http://localhost", "5000"].join(":") + "/api";
const fallbackApiUrl = import.meta.env.DEV ? localApiUrl : "/api";
const configuredApiUrl = import.meta.env.VITE_API_URL;

function isLoopbackApiUrl(value: string | undefined) {
  if (!value || !import.meta.env.PROD) return false;
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

const API_BASE_URL = (
  isLoopbackApiUrl(configuredApiUrl) ? fallbackApiUrl : configuredApiUrl || fallbackApiUrl
).replace(/\/$/, "");

type ApiOptions = RequestInit & { skipJson?: boolean };

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!options.skipJson && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new ApiClientError(
      payload?.message || "Request failed",
      response.status,
      payload?.details,
    );
  }

  return payload as T;
}

export { API_BASE_URL };
