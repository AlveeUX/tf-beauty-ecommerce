export const dynamic = "force-dynamic";

/** Liveness check for hosts and the E2E runner. */
export function GET() {
  return Response.json({ status: "ok" });
}
