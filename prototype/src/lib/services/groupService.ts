import { prisma } from "@/lib/db";
import { calculateBalances, suggestSettlements } from "@/lib/domain/balances";
import type { GroupDetail, GroupSummary } from "@/lib/types";
import { NotFoundError } from "./errors";
import { requireObject, requireText } from "./validation";

export const GROUP_NAME_MAX = 50;

/** FR1: list every group, newest first. */
export async function listGroups(): Promise<GroupSummary[]> {
  const groups = await prisma.group.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: { _count: { select: { members: true, expenses: true } } },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    memberCount: g._count.members,
    expenseCount: g._count.expenses,
  }));
}

/** FR1: create a group. Names need not be unique. */
export async function createGroup(body: unknown): Promise<GroupSummary> {
  const input = requireObject(body);
  const name = requireText(input.name, "name", "Group name", GROUP_NAME_MAX);
  const group = await prisma.group.create({ data: { name } });
  return {
    id: group.id,
    name: group.name,
    createdAt: group.createdAt.toISOString(),
    memberCount: 0,
    expenseCount: 0,
  };
}

/**
 * Everything the group screen shows: members (FR2), expense history (FR4),
 * and balances (FR5). Read in one transaction so the figures on the screen
 * come from the same snapshot.
 */
export async function getGroupDetail(groupId: string): Promise<GroupDetail> {
  const group = await prisma.$transaction(async (tx) =>
    tx.group.findUnique({
      where: { id: groupId },
      include: {
        members: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        expenses: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          include: { shares: { orderBy: { position: "asc" } } },
        },
      },
    }),
  );
  if (!group) {
    throw new NotFoundError("Group not found. It may have been deleted, or the link is wrong.");
  }

  const nameOf = new Map(group.members.map((m) => [m.id, m.name]));

  // Balances are calculated oldest-first so the order matches how they accrued;
  // the result does not depend on order.
  const balances = calculateBalances(
    group.members.map((m) => ({ id: m.id, name: m.name })),
    [...group.expenses].reverse(),
  );

  return {
    id: group.id,
    name: group.name,
    createdAt: group.createdAt.toISOString(),
    members: group.members.map((m) => ({
      id: m.id,
      name: m.name,
      createdAt: m.createdAt.toISOString(),
    })),
    expenses: group.expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      payerId: e.payerId,
      payerName: nameOf.get(e.payerId) ?? "Unknown",
      createdAt: e.createdAt.toISOString(),
      shares: e.shares.map((s) => ({
        memberId: s.memberId,
        memberName: nameOf.get(s.memberId) ?? "Unknown",
        position: s.position,
        amountCents: s.amountCents,
      })),
    })),
    balances,
    balanceSumCents: balances.reduce((sum, b) => sum + b.balanceCents, 0),
    settlements: suggestSettlements(balances).map((t) => ({
      ...t,
      fromName: nameOf.get(t.fromMemberId) ?? "Unknown",
      toName: nameOf.get(t.toMemberId) ?? "Unknown",
    })),
    totalSpentCents: group.expenses.reduce((sum, e) => sum + e.amountCents, 0),
  };
}
