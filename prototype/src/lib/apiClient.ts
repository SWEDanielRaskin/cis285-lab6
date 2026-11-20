import type { ApiError, ExpenseView, GroupDetail, GroupSummary, MemberView } from "@/lib/types";

/** An API error carrying the server's message and the field it refers to. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly field?: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError("Could not reach the server. Is it running?", 0);
  }

  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    const err = body as ApiError | null;
    throw new ApiRequestError(err?.error ?? `Request failed (${response.status}).`, response.status, err?.field);
  }
  return body as T;
}

export const api = {
  listGroups: () => request<GroupSummary[]>("/api/groups"),
  createGroup: (name: string) =>
    request<GroupSummary>("/api/groups", { method: "POST", body: JSON.stringify({ name }) }),
  getGroup: (groupId: string) => request<GroupDetail>(`/api/groups/${encodeURIComponent(groupId)}`),
  addMember: (groupId: string, name: string) =>
    request<MemberView>(`/api/groups/${encodeURIComponent(groupId)}/members`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  recordExpense: (
    groupId: string,
    input: { description: string; amount: string; payerId: string; participantIds: string[] },
  ) =>
    request<ExpenseView>(`/api/groups/${encodeURIComponent(groupId)}/expenses`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
