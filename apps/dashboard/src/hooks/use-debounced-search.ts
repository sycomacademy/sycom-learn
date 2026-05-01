import { useEffect, useRef, useState, useTransition } from "react";

type UseDebouncedSearchOptions = {
  /** Current value from the URL (e.g. `search.search` after `validateSearch`). */
  committedValue: string | undefined;
  /**
   * Runs after `delayMs` when the trimmed draft differs from `committedValue`.
   * Call `navigate({ replace: true, search: ... })` here so history is not thrashed.
   */
  onDebouncedCommit: (next: string | undefined) => void;
  delayMs?: number;
};

/**
 * Keeps a local draft in sync with the URL (back/forward, shared links) while debouncing
 * writes back to the router. Pair with `navigate({ replace: true, ... })` in `onDebouncedCommit`
 * so typing does not push a new history entry per keystroke.
 */
export function useDebouncedSearch(options: UseDebouncedSearchOptions) {
  const { committedValue, onDebouncedCommit, delayMs = 300 } = options;
  const commitRef = useRef(onDebouncedCommit);
  commitRef.current = onDebouncedCommit;

  const [isTransitionPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(() => committedValue ?? "");
  const normalizedCommittedValue = committedValue ?? undefined;
  const normalizedDraftValue = searchInput.trim() || undefined;
  const isSearchPending = isTransitionPending || normalizedCommittedValue !== normalizedDraftValue;

  useEffect(() => {
    setSearchInput(committedValue ?? "");
  }, [committedValue]);

  useEffect(() => {
    if (normalizedCommittedValue === normalizedDraftValue) return;
    const handle = window.setTimeout(() => {
      startTransition(() => {
        commitRef.current(normalizedDraftValue);
      });
    }, delayMs);
    return () => window.clearTimeout(handle);
  }, [delayMs, normalizedCommittedValue, normalizedDraftValue, startTransition]);

  return { searchInput, setSearchInput, isSearchPending };
}
