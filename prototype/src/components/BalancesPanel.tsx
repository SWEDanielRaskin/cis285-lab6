import { formatCents, formatSignedCents } from "@/lib/domain/money";
import type { BalanceView, TransferView } from "@/lib/types";
import { Card, EmptyState } from "./ui";

interface Props {
  balances: BalanceView[];
  balanceSumCents: number;
  settlements: TransferView[];
}

/** FR5: what each member should receive (+) or owes (-). */
export function BalancesPanel({ balances, balanceSumCents, settlements }: Props) {
  return (
    <Card
      title="Balances"
      subtitle={
        <>
          + should receive · − owes · sum{" "}
          <span className="font-mono" data-testid="balance-sum">
            {formatCents(balanceSumCents)}
          </span>
        </>
      }
    >
      {balances.length === 0 ? (
        <EmptyState>Add members to see balances.</EmptyState>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Member</th>
                <th className="pb-2 text-right font-medium">Paid</th>
                <th className="pb-2 text-right font-medium">Share</th>
                <th className="pb-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.map((b) => (
                <tr key={b.memberId}>
                  <td className="py-2 font-medium text-slate-800">{b.name}</td>
                  <td className="py-2 text-right font-mono text-slate-600">{formatCents(b.paidCents)}</td>
                  <td className="py-2 text-right font-mono text-slate-600">{formatCents(b.shareCents)}</td>
                  <td
                    className={`py-2 text-right font-mono font-semibold ${
                      b.balanceCents > 0 ? "text-emerald-700" : b.balanceCents < 0 ? "text-red-700" : "text-slate-500"
                    }`}
                    data-testid={`balance-${b.name}`}
                  >
                    {formatSignedCents(b.balanceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {settlements.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">To settle up</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {settlements.map((t) => (
                  <li key={`${t.fromMemberId}-${t.toMemberId}`}>
                    <span className="font-medium">{t.fromName}</span> pays{" "}
                    <span className="font-medium">{t.toName}</span>{" "}
                    <span className="font-mono">{formatCents(t.amountCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
