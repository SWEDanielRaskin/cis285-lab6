"use client";

import { useState, type FormEvent } from "react";
import type { MemberView } from "@/lib/types";
import { Card, EmptyState, ErrorMessage, buttonClass, inputClass } from "./ui";

interface Props {
  members: MemberView[];
  onAdd: (name: string) => Promise<void>;
}

/** FR2: add members and see who is in the group. */
export function MembersPanel({ members, onAdd }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "") {
      setError("Member name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(name);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Members" subtitle={`${members.length} in this group`}>
      <form onSubmit={submit} className="mb-4" noValidate>
        <label htmlFor="member-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Add a member
        </label>
        <div className="flex gap-2">
          <input
            id="member-name"
            className={inputClass}
            value={name}
            maxLength={50}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <button type="submit" className={buttonClass} disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
        <ErrorMessage message={error} />
      </form>

      {members.length === 0 ? (
        <EmptyState>No members yet. Add the people who share expenses.</EmptyState>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Member list">
          {members.map((m) => (
            <li
              key={m.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-sm text-slate-800"
            >
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white"
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
