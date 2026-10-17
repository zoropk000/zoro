function isLoopbackUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

// Local development and production both have same-origin /api handlers. Ignore old
// localhost:5000 values so the browser never depends on a second local listener.
// A separately hosted production backend can still use an explicit HTTPS URL.
const configuredApiUrl = String(import.meta.env.VITE_API_URL || "")
  .split(",")
  .map((value) => value.trim())
  .find(
    (value) => /^\/(?!\/)/.test(value) || (/^https?:\/\//i.test(value) && !isLoopbackUrl(value)),
  );
const API_BASE_URL = (configuredApiUrl || "/api").replace(/\/$/, "");

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
  // During SSR, skip all API calls. Data will be fetched client-side after hydration.
  // Making HTTP requests from the SSR server to itself causes cold-start failures on Vercel.
  if (import.meta.env.SSR) {
    throw new ApiClientError("SSR: skipping API call", 0);
  }

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
