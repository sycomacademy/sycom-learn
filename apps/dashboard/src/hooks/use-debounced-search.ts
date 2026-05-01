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

  const [isSearchPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(() => committedValue ?? "");

  useEffect(() => {
    setSearchInput(committedValue ?? "");
  }, [committedValue]);

  useEffect(() => {
    const next = searchInput.trim() || undefined;
    if ((committedValue ?? undefined) === next) return;
    const handle = window.setTimeout(() => {
      startTransition(() => {
        commitRef.current(next);
      });
    }, delayMs);
    return () => window.clearTimeout(handle);
  }, [committedValue, delayMs, searchInput, startTransition]);

  return { searchInput, setSearchInput, isSearchPending };
}
