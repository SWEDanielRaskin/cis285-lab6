/**
 * Balance calculation (FR5). Balances are never stored; they are recomputed
 * from the saved expenses and shares every time.
 *
 * For each expense:
 *   payer   += amount       (they paid the whole bill)
 *   each participant -= their share   (what they consumed, payer included)
 *
 * A positive balance means the member should receive money; negative means they owe.
 * Because shares add up to the amount, every expense adds exactly zero to the total,
 * so the balances of a group always sum to zero.
 */

export interface BalanceMember {
  id: string;
  name: string;
}

export interface BalanceExpense {
  payerId: string;
  amountCents: number;
  shares: { memberId: string; amountCents: number }[];
}

export interface MemberBalance {
  memberId: string;
  name: string;
  paidCents: number;
  shareCents: number;
  balanceCents: number;
}

export interface Transfer {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
}

export function calculateBalances(
  members: readonly BalanceMember[],
  expenses: readonly BalanceExpense[],
): MemberBalance[] {
  const rows = new Map<string, MemberBalance>();
  for (const m of members) {
    rows.set(m.id, { memberId: m.id, name: m.name, paidCents: 0, shareCents: 0, balanceCents: 0 });
  }

  const rowFor = (memberId: string): MemberBalance => {
    const row = rows.get(memberId);
    if (!row) {
      // The service layer prevents this; failing loudly beats a silently wrong balance.
      throw new Error(`Expense references member ${memberId}, who is not in this group`);
    }
    return row;
  };

  for (const expense of expenses) {
    const shareTotal = expense.shares.reduce((sum, s) => sum + s.amountCents, 0);
    if (shareTotal !== expense.amountCents) {
      throw new Error(
        `Shares (${shareTotal}) do not add up to the expense amount (${expense.amountCents})`,
      );
    }
    rowFor(expense.payerId).paidCents += expense.amountCents;
    for (const share of expense.shares) {
      rowFor(share.memberId).shareCents += share.amountCents;
    }
  }

  const result = [...rows.values()].map((r) => ({ ...r, balanceCents: r.paidCents - r.shareCents }));
  const total = result.reduce((sum, r) => sum + r.balanceCents, 0);
  if (total !== 0) {
    throw new Error(`Balances must sum to zero, got ${total}`);
  }
  return result;
}

/**
 * Suggests who pays whom to settle up: the biggest debtor pays the biggest
 * creditor, repeated. Ties are broken by the input order, so the output is
 * deterministic. Shown in the UI as a convenience only; nothing is recorded.
 */
export function suggestSettlements(balances: readonly MemberBalance[]): Transfer[] {
  const order = new Map(balances.map((b, i) => [b.memberId, i]));
  const byAmountThenOrder = (a: { id: string; cents: number }, b: { id: string; cents: number }) =>
    b.cents - a.cents || order.get(a.id)! - order.get(b.id)!;

  const creditors = balances
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({ id: b.memberId, cents: b.balanceCents }));
  const debtors = balances
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({ id: b.memberId, cents: -b.balanceCents }));

  const transfers: Transfer[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byAmountThenOrder);
    debtors.sort(byAmountThenOrder);
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.cents, debtor.cents);
    transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amountCents: amount });
    creditor.cents -= amount;
    debtor.cents -= amount;
    if (creditor.cents === 0) creditors.shift();
    if (debtor.cents === 0) debtors.shift();
  }
  return transfers;
}
