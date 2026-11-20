import { ValidationError } from "./errors";

/** Reads a required text field, trims it, and checks its length. */
export function requireText(
  value: unknown,
  field: string,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${label} is required.`, field);
  }
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`, field);
  }
  return text;
}

/** Ensures the request body is a JSON object. */
export function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}
