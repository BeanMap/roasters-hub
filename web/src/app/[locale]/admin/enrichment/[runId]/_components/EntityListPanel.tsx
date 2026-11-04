"use client";

import React, { useState, useMemo } from "react";
import type { EntitySummary } from "./types";

interface EntityListPanelProps {
  entities: EntitySummary[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const PAGE_SIZE = 20;

export function EntityListPanel({ entities, selectedKey, onSelect }: EntityListPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "new" | "done">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return entities
      .filter((e) => {
        if (search && !e.entityName.toLowerCase().includes(search.toLowerCase())) return false;
        if (filter === "pending") return e.pendingCount > 0;
        if (filter === "new") return e.isNew;
        if (filter === "done") return e.pendingCount === 0;
        return true;
      });
  }, [entities, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const confColor = (conf: number) =>
    conf >= 0.8 ? "bg-green-500" : conf >= 0.6 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="flex w-[300px] flex-shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-outline-variant p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="🔍  Szukaj encji…"
          className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm outline-none focus:border-amber-700"
        />
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "pending", "new", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline-variant"
              }`}
            >
              {f === "all" ? "Wszystkie" : f === "pending" ? "Do przejrzenia" : f === "new" ? "Nowe" : "Zatwierdzone"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {paged.length === 0 && (
          <p className="p-4 text-center text-sm text-on-surface-variant">Brak wyników</p>
        )}
        {paged.map((entity) => (
          <button
            key={entity.key}
            onClick={() => onSelect(entity.key)}
            className={`w-full border-b border-stone-50 p-3 text-left transition-colors hover:bg-surface-container-low ${
              selectedKey === entity.key ? "border-l-[3px] border-l-amber-700 bg-amber-50/40 pl-2.5" : ""
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-xl">☕</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-on-surface">{entity.entityName}</p>
                <p className="text-[10px] text-on-surface-variant">{entity.city ?? "—"} · {entity.sources.join(", ")}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {entity.isNew && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">NOWA</span>
                  )}
                  {entity.hasNameChange && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">⚠ Zmiana nazwy</span>
                  )}
                  {entity.pendingCount > 0 && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                      {entity.pendingCount} propozy{entity.pendingCount === 1 ? "cja" : "cji"}
                    </span>
                  )}
                  {entity.pendingCount === 0 && entity.appliedCount > 0 && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">Zatwierdzona</span>
                  )}
                </div>
                <div className="mt-1.5 h-[3px] w-full rounded-full bg-surface-container-low">
                  <div
                    className={`h-full rounded-full ${confColor(entity.minConf)}`}
                    style={{ width: `${Math.round(entity.minConf * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-outline-variant px-3 py-2 text-xs text-on-surface-variant">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} z {filtered.length}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-outline-variant px-1.5 py-0.5 disabled:opacity-30"
            >‹</button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-outline-variant px-1.5 py-0.5 disabled:opacity-30"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
