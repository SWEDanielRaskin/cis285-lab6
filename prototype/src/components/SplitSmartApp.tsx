"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError } from "@/lib/apiClient";
import { formatCents } from "@/lib/domain/money";
import type { GroupDetail, GroupSummary } from "@/lib/types";
import { BalancesPanel } from "./BalancesPanel";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseHistory } from "./ExpenseHistory";
import { GroupSidebar } from "./GroupSidebar";
import { MembersPanel } from "./MembersPanel";
import { EmptyState, ErrorMessage } from "./ui";

/** Keeps the selected group in the URL (?group=...) so a refresh reopens it. */
function readGroupFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("group");
}
function writeGroupToUrl(groupId: string | null) {
  const url = new URL(window.location.href);
  if (groupId) url.searchParams.set("group", groupId);
  else url.searchParams.delete("group");
  window.history.replaceState(null, "", url);
}

export function SplitSmartApp() {
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshGroups = useCallback(async () => {
    const list = await api.listGroups();
    setGroups(list);
    return list;
  }, []);

  const loadDetail = useCallback(async (groupId: string) => {
    try {
      setDetail(await api.getGroup(groupId));
      setLoadError(null);
    } catch (err) {
      setDetail(null);
      setLoadError(err instanceof Error ? err.message : "Could not load the group.");
      if (err instanceof ApiRequestError && err.status === 404) {
        setSelectedId(null);
        writeGroupToUrl(null);
      }
    }
  }, []);

  // First load: read the saved data and reopen the group named in the URL.
  useEffect(() => {
    (async () => {
      try {
        const list = await refreshGroups();
        const fromUrl = readGroupFromUrl();
        const initial = list.find((g) => g.id === fromUrl)?.id ?? list[0]?.id ?? null;
        if (fromUrl && initial !== fromUrl) {
          setLoadError("That group could not be found, so the first group is shown instead.");
        }
        setSelectedId(initial);
        writeGroupToUrl(initial);
        if (initial) await loadDetail(initial);
      } catch (err) {
        setGroups([]);
        setLoadError(err instanceof Error ? err.message : "Could not load groups.");
      }
    })();
  }, [refreshGroups, loadDetail]);

  async function selectGroup(groupId: string) {
    setSelectedId(groupId);
    writeGroupToUrl(groupId);
    setLoadError(null);
    await loadDetail(groupId);
  }

  async function createGroup(name: string) {
    const group = await api.createGroup(name);
    await refreshGroups();
    await selectGroup(group.id);
  }

  // After any change, reload from the server so the screen shows what was saved.
  async function afterChange() {
    if (!selectedId) return;
    await Promise.all([loadDetail(selectedId), refreshGroups()]);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-lg font-bold text-white"
          >
            S
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-900">SplitSmart</h1>
            <p className="text-xs text-slate-500">Share expenses fairly, to the cent</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_1fr]">
        {groups === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <GroupSidebar groups={groups} selectedId={selectedId} onSelect={selectGroup} onCreate={createGroup} />
        )}

        <div className="min-w-0">
          <ErrorMessage message={loadError} />

          {groups !== null && groups.length === 0 && (
            <EmptyState>Create your first group to start sharing expenses.</EmptyState>
          )}

          {detail && detail.id === selectedId && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-semibold text-slate-900" data-testid="group-title">
                  {detail.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {detail.members.length} members · {formatCents(detail.totalSpentCents)} spent
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="flex flex-col gap-6">
                  <MembersPanel
                    members={detail.members}
                    onAdd={async (name) => {
                      await api.addMember(detail.id, name);
                      await afterChange();
                    }}
                  />
                  <ExpenseForm
                    key={detail.id}
                    members={detail.members}
                    onRecord={async (input) => {
                      await api.recordExpense(detail.id, input);
                      await afterChange();
                    }}
                  />
                </div>
                <div className="flex flex-col gap-6">
                  <BalancesPanel
                    balances={detail.balances}
                    balanceSumCents={detail.balanceSumCents}
                    settlements={detail.settlements}
                  />
                  <ExpenseHistory expenses={detail.expenses} totalSpentCents={detail.totalSpentCents} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
