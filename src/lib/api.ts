/** Shape of a failed form submission (see src/lib/demo-store/forms.ts). */
type ApiFailure = {
  code?: string;
  message?: string;
  errors?: Record<string, string>;
  items?: string[];
};

export type ApiResult<T> =
  { ok: true; status: number; data: T } | { ok: false; status: number; data: ApiFailure };
