export class UnauthorizedRequestError extends Error {
  constructor() {
    super("Unauthorized request");
    this.name = "UnauthorizedRequestError";
  }
}

function defaultRedirectPath() {
  if (typeof window === "undefined") return "/login";
  const pathname = window.location.pathname;
  if (pathname.startsWith("/admin")) return "/admin";
  return "/login";
}

type FetchWithAuthRedirectOptions = {
  redirectTo?: string;
};

export async function fetchWithAuthRedirect(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchWithAuthRedirectOptions
) {
  const response = await fetch(input, init);
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.assign(options?.redirectTo ?? defaultRedirectPath());
    }
    throw new UnauthorizedRequestError();
  }
  return response;
}
