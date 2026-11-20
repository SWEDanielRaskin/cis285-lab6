import { NextResponse } from "next/server";
import { NotFoundError, ValidationError } from "@/lib/services/errors";
import type { ApiError } from "@/lib/types";

/** Reads a JSON body. Malformed JSON becomes a ValidationError, not a crash. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

/**
 * Runs a handler and turns known errors into JSON responses with a clear message.
 * Anything unexpected is logged on the server and shown as a generic message.
 */
export async function handle<T>(work: () => Promise<T>, successStatus = 200): Promise<NextResponse> {
  try {
    const data = await work();
    return NextResponse.json(data, { status: successStatus });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json<ApiError>({ error: err.message, field: err.field }, { status: 400 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json<ApiError>({ error: err.message }, { status: 404 });
    }
    console.error("Unexpected API error:", err);
    return NextResponse.json<ApiError>(
      { error: "Something went wrong on the server. Please try again." },
      { status: 500 },
    );
  }
}
