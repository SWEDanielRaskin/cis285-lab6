"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatCents, parseAmountToCents } from "@/lib/domain/money";
import { allocateEqualSplit } from "@/lib/domain/split";
import type { MemberView } from "@/lib/types";
import { Card, ErrorMessage, buttonClass, inputClass } from "./ui";

interface Props {
  members: MemberView[];
  onRecord: (input: {
    description: string;
    amount: string;
    payerId: string;
    participantIds: string[];
  }) => Promise<void>;
}

/** FR3: record an expense with description, amount, payer, and participants. */
export function ExpenseForm({ members, onRecord }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // Member IDs seen on the previous render. When a member is added, they are
  // ticked by default, without re-ticking people the user unticked.
  const knownIds = useRef<Set<string>>(new Set(members.map((m) => m.id)));
  useEffect(() => {
    const known = knownIds.current;
    setSelected((prev) => {
      const next = new Set<string>();
      for (const m of members) {
        if (prev.has(m.id) || !known.has(m.id)) next.add(m.id);
      }
      return next;
    });
    knownIds.current = new Set(members.map((m) => m.id));
  }, [members]);

  // Participants are listed in member order; that order decides leftover cents.
  const participantIds = members.filter((m) => selected.has(m.id)).map((m) => m.id);

  const parsedAmount = parseAmountToCents(amount);
  const preview =
    parsedAmount.ok && participantIds.length > 0 ? allocateEqualSplit(parsedAmount.cents, participantIds) : null;

  if (members.length === 0) {
    return (
      <Card title="Record an expense">
        <p className="text-sm text-slate-500">Add at least one member before recording expenses.</p>
      </Card>
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSavedNote(null);

    // Check on the client for fast feedback; the server checks everything again.
    if (description.trim() === "") return setError("Description is required.");
    const parsed = parseAmountToCents(amount);
    if (!parsed.ok) return setError(parsed.error);
    if (!payerId) return setError("Choose who paid.");
    if (participantIds.length === 0) return setError("Choose at least one person to split the expense with.");

    setSaving(true);
    setError(null);
    try {
      await onRecord({ description, amount, payerId, participantIds });
      setSavedNote(`Saved "${description.trim()}" (${formatCents(parsed.cents)}).`);
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the expense.");
    } finally {
      setSaving(false);
    }
  }

  const nameOf = new Map(members.map((m) => [m.id, m.name]));

  return (
    <Card title="Record an expense" subtitle="Split equally among the people selected">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="expense-description" className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            id="expense-description"
            className={inputClass}
            value={description}
            maxLength={200}
            placeholder="e.g. Groceries"
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expense-amount" className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                $
              </span>
              <input
                id="expense-amount"
                className={`${inputClass} pl-7`}
                value={amount}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div>
            <label htmlFor="expense-payer" className="mb-1.5 block text-sm font-medium text-slate-700">
              Paid by
            </label>
            <select
              id="expense-payer"
              className={inputClass}
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              disabled={saving}
            >
              <option value="">Choose a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <div className="mb-1.5 flex items-center justify-between">
            <legend className="text-sm font-medium text-slate-700">Split between</legend>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="text-teal-700 hover:underline"
                onClick={() => setSelected(new Set(members.map((m) => m.id)))}
              >
                All
              </button>
              <button type="button" className="text-teal-700 hover:underline" onClick={() => setSelected(new Set())}>
                None
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const checked = selected.has(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                    checked ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-300 text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-teal-700"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    disabled={saving}
                  />
                  {m.name}
                </label>
              );
            })}
          </div>
        </fieldset>

        {preview && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600" aria-live="polite">
            Each share:{" "}
            {preview.map((s, i) => (
              <span key={s.memberId}>
                {i > 0 && ", "}
                {nameOf.get(s.memberId)} <span className="font-mono">{formatCents(s.amountCents)}</span>
              </span>
            ))}
          </p>
        )}

        <ErrorMessage message={error} />
        {savedNote && (
          <p role="status" className="text-sm text-teal-800">
            {savedNote}
          </p>
        )}

        <div>
          <button type="submit" className={buttonClass} disabled={saving}>
            {saving ? "Saving…" : "Record expense"}
          </button>
        </div>
      </form>
    </Card>
  );
}
