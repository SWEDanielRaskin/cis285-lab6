/**
 * Money helpers. All money is held as integer cents. Floats never hold money,
 * so "0.1 + 0.2" style errors cannot reach a balance.
 */

export const MIN_AMOUNT_CENTS = 1; // $0.01
export const MAX_AMOUNT_CENTS = 100_000_000; // $1,000,000.00

export type ParseResult =
  | { ok: true; cents: number }
  | { ok: false; error: string };

// Digits, optional "." followed by 1 or 2 digits. No sign, no exponent, no commas.
const AMOUNT_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses a user-entered dollar amount (for example "60", "60.5", "10.00") into cents.
 * The text is parsed digit by digit, never through parseFloat.
 * More than two decimals is refused rather than rounded.
 */
export function parseAmountToCents(input: unknown): ParseResult {
  if (input === null || input === undefined) {
    return { ok: false, error: "Amount is required." };
  }
  let raw: string;
  if (typeof input === "string") {
    raw = input;
  } else if (typeof input === "number" && Number.isFinite(input)) {
    // JSON numbers are checked through their text form, so float noise such as
    // 0.30000000000000004 is refused for having too many decimals.
    raw = String(input);
  } else {
    return { ok: false, error: "Amount must be a number such as 12.50." };
  }

  const text = raw.trim().replace(/^\$/, "");
  if (text === "") {
    return { ok: false, error: "Amount is required." };
  }
  if (text.startsWith("-")) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const match = AMOUNT_PATTERN.exec(text);
  if (!match) {
    if (/^\d+\.\d{3,}$/.test(text)) {
      return { ok: false, error: "Amount can have at most two decimal places." };
    }
    return { ok: false, error: "Amount must be a number such as 12.50." };
  }

  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(2, "0");

  // Check length before converting so huge inputs cannot lose precision.
  if (whole.length > 7) {
    return { ok: false, error: "Amount cannot be more than $1,000,000.00." };
  }

  const cents = Number(whole) * 100 + Number(fraction);
  if (cents < MIN_AMOUNT_CENTS) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (cents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: "Amount cannot be more than $1,000,000.00." };
  }
  return { ok: true, cents };
}

/** Formats cents as dollars: 1234 -> "$12.34", -2000 -> "-$20.00". */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatCents expects integer cents, got ${cents}`);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars}.${rest}`;
}

/** Formats a balance with an explicit sign: +$40.00, -$20.00, $0.00. */
export function formatSignedCents(cents: number): string {
  if (cents > 0) return `+${formatCents(cents)}`;
  return formatCents(cents);
}
