"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { IconExternal } from "@/components/ui/Icons";
import { RESOURCE_CATEGORIES, labelFor } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface ResourceView {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  tags: string[];
  visibility: string;
  addedBy: string | null;
}

/**
 * Client-side search and category filter over a list the server already
 * scoped to what this member is allowed to see. Filtering here never widens
 * visibility — it can only narrow an authorised list.
 */
export function ResourceBrowser({ resources }: { resources: ResourceView[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");

  const categories = useMemo(() => {
    const present = new Set(resources.map((resource) => resource.category));
    return (Object.keys(RESOURCE_CATEGORIES) as (keyof typeof RESOURCE_CATEGORIES)[]).filter((key) => present.has(key));
  }, [resources]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (category !== "ALL" && resource.category !== category) return false;
      if (!needle) return true;
      return (
        resource.title.toLowerCase().includes(needle) ||
        (resource.description ?? "").toLowerCase().includes(needle) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [resources, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="resource-search" className="sr-only">
            Search resources
          </label>
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, description, or tag…"
            className="w-full border-2 border-rule bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-navy-600"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only sm:not-sr-only sm:font-medium sm:text-ink/60">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border-2 border-rule bg-paper-raised px-3 py-2.5 text-sm font-medium text-ink"
          >
            <option value="ALL">All categories</option>
            {categories.map((key) => (
              <option key={key} value={key}>
                {RESOURCE_CATEGORIES[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-ink/60">
        {filtered.length === resources.length
          ? `${resources.length} resource${resources.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${resources.length} resources`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Nothing matches that search"
        />
      ) : (
        <ul className="mt-5 grid gap-6 md:grid-cols-2">
          {filtered.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex h-full flex-col  border-2 border-rule bg-paper-raised p-5",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-300",
                  "motion-reduce:hover:translate-y-0",
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-600">
                    {labelFor(RESOURCE_CATEGORIES, resource.category)}
                  </span>
                  <span className="shrink-0 text-ink/60 transition-colors group-hover:text-navy-600" aria-hidden="true">
                    <IconExternal className="h-4 w-4" />
                  </span>
                </div>

                <h3 className="mt-2 font-display text-base font-semibold text-ink group-hover:text-navy-600">
                  {resource.title}
                </h3>
                {resource.description ? (
                  <p className="mt-1.5 text-base leading-relaxed text-ink/60">{resource.description}</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                  {resource.visibility === "OFFICER" ? <Badge tone="warn">Officers only</Badge> : null}
                  {resource.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-paper-sunk px-2.5 py-0.5 text-[11px] font-medium text-ink/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
