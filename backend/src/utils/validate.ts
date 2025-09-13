export const isNonEmptyString = (v: any) =>
  typeof v === "string" && v.trim().length > 0;
export const hasMin = (v: string, n: number) =>
  typeof v === "string" && v.length >= n;
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
export const isOtp = (v: string) => /^\d{4,6}$/.test(v);
export function requireFields(body: any, fields: string[]): string | null {
  if (!body || typeof body !== "object") return "Missing JSON body";
  for (const f of fields) {
    if (!(f in body)) return `Missing field: ${f}`;
  }
  return null;
}
