export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Local CLI clients do not send Origin.
  try {
    const external = new URL(origin);
    const incoming = new URL(request.url);
    // Next.js can put the bind address in request.url; Host retains the browser-facing address.
    return (
      external.host === (request.headers.get("host") || incoming.host) &&
      external.protocol === incoming.protocol
    );
  } catch {
    return false;
  }
}
