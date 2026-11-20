import { prisma } from "@/lib/db";
import { parseAmountToCents } from "@/lib/domain/money";
import { allocateEqualSplit } from "@/lib/domain/split";
import type { ExpenseView } from "@/lib/types";
import { NotFoundError, ValidationError } from "./errors";
import { requireObject, requireText } from "./validation";

export const DESCRIPTION_MAX = 200;

interface ExpenseInput {
  description: string;
  amountCents: number;
  payerId: string;
  participantIds: string[];
}

/** Checks the shape of the request. Group membership is checked inside the transaction. */
function parseExpenseInput(body: unknown): ExpenseInput {
  const input = requireObject(body);

  const description = requireText(input.description, "description", "Description", DESCRIPTION_MAX);

  const amount = parseAmountToCents(input.amount);
  if (!amount.ok) {
    throw new ValidationError(amount.error, "amount");
  }

  if (typeof input.payerId !== "string" || input.payerId.trim() === "") {
    throw new ValidationError("Choose who paid.", "payerId");
  }
  const payerId = input.payerId.trim();

  if (!Array.isArray(input.participantIds) || input.participantIds.length === 0) {
    throw new ValidationError("Choose at least one person to split the expense with.", "participantIds");
  }
  if (!input.participantIds.every((id) => typeof id === "string" && id.trim() !== "")) {
    throw new ValidationError("Participant IDs must be non-empty text.", "participantIds");
  }
  const participantIds = (input.participantIds as string[]).map((id) => id.trim());
  if (new Set(participantIds).size !== participantIds.length) {
    throw new ValidationError("Each participant can be selected only once.", "participantIds");
  }

  return { description, amountCents: amount.cents, payerId, participantIds };
}

/**
 * FR3: record an expense split equally among the selected participants.
 * The participant order given is kept, and decides who gets leftover cents.
 */
export async function recordExpense(groupId: string, body: unknown): Promise<ExpenseView> {
  const input = parseExpenseInput(body);
  const shares = allocateEqualSplit(input.amountCents, input.participantIds);

  return prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { members: { select: { id: true, name: true } } },
    });
    if (!group) {
      throw new NotFoundError("Group not found.");
    }

    const nameOf = new Map(group.members.map((m) => [m.id, m.name]));
    if (!nameOf.has(input.payerId)) {
      throw new ValidationError("The payer must be a member of this group.", "payerId");
    }
    const outsiders = input.participantIds.filter((id) => !nameOf.has(id));
    if (outsiders.length > 0) {
      throw new ValidationError(
        outsiders.length === 1
          ? "One of the selected participants is not a member of this group."
          : `${outsiders.length} of the selected participants are not members of this group.`,
        "participantIds",
      );
    }

    const expense = await tx.expense.create({
      data: {
        groupId,
        description: input.description,
        amountCents: input.amountCents,
        payerId: input.payerId,
        shares: { create: shares },
      },
      include: { shares: { orderBy: { position: "asc" } } },
    });

    return {
      id: expense.id,
      description: expense.description,
      amountCents: expense.amountCents,
      payerId: expense.payerId,
      payerName: nameOf.get(expense.payerId)!,
      createdAt: expense.createdAt.toISOString(),
      shares: expense.shares.map((s) => ({
        memberId: s.memberId,
        memberName: nameOf.get(s.memberId)!,
        position: s.position,
        amountCents: s.amountCents,
      })),
    };
  });
}
