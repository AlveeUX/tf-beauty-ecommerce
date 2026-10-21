/** Consistent JSON error shape for every API route: { code, message, fields? } (PRD section 11.2). */
type ApiError = { code: string; message: string; fields?: string[] };

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: string[],
): Response {
  return Response.json(
    { code, message, ...(fields?.length ? { fields } : {}) } satisfies ApiError,
    { status },
  );
}
