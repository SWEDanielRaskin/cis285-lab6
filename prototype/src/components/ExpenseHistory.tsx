import { formatCents } from "@/lib/domain/money";
import type { ExpenseView } from "@/lib/types";
import { Card, EmptyState } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** FR4: every expense recorded for the selected group, newest first. */
export function ExpenseHistory({ expenses, totalSpentCents }: { expenses: ExpenseView[]; totalSpentCents: number }) {
  return (
    <Card
      title="Expense history"
      subtitle={`${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} · ${formatCents(totalSpentCents)} total`}
    >
      {expenses.length === 0 ? (
        <EmptyState>No expenses recorded yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100" aria-label="Expenses">
          {expenses.map((e) => (
            <li key={e.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate font-medium text-slate-900">{e.description}</p>
                <p className="shrink-0 font-mono text-sm font-semibold text-slate-900">{formatCents(e.amountCents)}</p>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Paid by <span className="font-medium text-slate-800">{e.payerName}</span> ·{" "}
                <time dateTime={e.createdAt}>{dateFormat.format(new Date(e.createdAt))}</time>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Split {e.shares.length} {e.shares.length === 1 ? "way" : "ways"}:{" "}
                {e.shares.map((s, i) => (
                  <span key={s.memberId}>
                    {i > 0 && ", "}
                    {s.memberName} <span className="font-mono">{formatCents(s.amountCents)}</span>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
