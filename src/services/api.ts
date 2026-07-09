const configuredApiUrl = import.meta.env.VITE_API_URL;

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function withApiPath(value: string) {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

function getServerApiUrl() {
  const explicit = process.env.VITE_API_URL;
  if (explicit?.startsWith("http")) return trimTrailingSlash(explicit);

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) return withApiPath(frontendUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return withApiPath(`https://${vercelUrl}`);

  return ["http://localhost", "5000"].join(":") + "/api";
}

function isLoopbackApiUrl(value: string | undefined) {
  if (!value || !import.meta.env.PROD) return false;
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

const fallbackApiUrl = import.meta.env.DEV
  ? ["http://localhost", "5000"].join(":") + "/api"
  : "/api";

const API_BASE_URL = trimTrailingSlash(
  import.meta.env.SSR
    ? getServerApiUrl()
    : isLoopbackApiUrl(configuredApiUrl)
      ? fallbackApiUrl
      : configuredApiUrl || fallbackApiUrl,
);

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
