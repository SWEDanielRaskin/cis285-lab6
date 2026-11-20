"use client";

import { useState, type FormEvent } from "react";
import type { GroupSummary } from "@/lib/types";
import { ErrorMessage, buttonClass, inputClass } from "./ui";

interface Props {
  groups: GroupSummary[];
  selectedId: string | null;
  onSelect: (groupId: string) => void;
  onCreate: (name: string) => Promise<void>;
}

/** FR1: create a group and pick one of the existing groups. */
export function GroupSidebar({ groups, selectedId, onSelect, onCreate }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "") {
      setError("Group name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate(name);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="flex flex-col gap-4">
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" noValidate>
        <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          New group
        </label>
        <div className="flex gap-2">
          <input
            id="group-name"
            className={inputClass}
            value={name}
            maxLength={50}
            placeholder="e.g. Ski trip"
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <button type="submit" className={buttonClass} disabled={saving}>
            {saving ? "…" : "Create"}
          </button>
        </div>
        <ErrorMessage message={error} />
      </form>

      <nav aria-label="Groups" className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <h2 className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your groups ({groups.length})
        </h2>
        {groups.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">No groups yet. Create one above.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {groups.map((g) => {
              const active = g.id === selectedId;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(g.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      active ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block truncate text-sm font-medium">{g.name}</span>
                    <span className="block text-xs text-slate-500">
                      {g.memberCount} {g.memberCount === 1 ? "member" : "members"} · {g.expenseCount}{" "}
                      {g.expenseCount === 1 ? "expense" : "expenses"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
