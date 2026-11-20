/**
 * Equal split with deterministic leftover cents (spec FR-011, FR-012, BR-04, BR-06):
 *   1. Every participant gets floor(amount / count) cents.
 *   2. The leftover cents (amount mod count) go one each to participants
 *      in the order they were listed, starting with the first.
 * So the shares always add up to exactly the amount, and the same inputs
 * always give the same result.
 */

export interface ShareAllocation {
  memberId: string;
  position: number;
  amountCents: number;
}

export function allocateEqualSplit(
  amountCents: number,
  participantIds: readonly string[],
): ShareAllocation[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("amountCents must be a positive integer");
  }
  if (participantIds.length === 0) {
    throw new Error("At least one participant is required");
  }
  if (new Set(participantIds).size !== participantIds.length) {
    throw new Error("Participants must be distinct");
  }

  const count = participantIds.length;
  const base = Math.floor(amountCents / count);
  const leftover = amountCents % count;

  return participantIds.map((memberId, position) => ({
    memberId,
    position,
    amountCents: base + (position < leftover ? 1 : 0),
  }));
}
