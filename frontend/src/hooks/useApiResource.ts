import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface UseApiResourceResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  /** Re-runs the fetcher (e.g. after a create/update/delete elsewhere on the page). */
  refetch: () => void;
}

/**
 * Shared fetch/loading/error/refetch pattern for a single API resource, replacing the
 * hand-rolled `useState` + `useEffect` + `load()` trio that was duplicated across most pages.
 *
 * `initialValue` is returned as `data` before the first fetch resolves and is restored on
 * error, so callers that expect e.g. an array (`.map`, `.length`) never need a null-check —
 * matching how most pages already seeded their `useState` before this hook existed.
 *
 * The fetcher itself is read through a ref on every call rather than being a dependency, so
 * passing a fresh inline arrow function each render (the common case) doesn't re-trigger the
 * effect — only the explicit `deps` array does, mirroring `useEffect`'s own contract.
 */
export function useApiResource<T>(
  fetcher: () => Promise<{ data: T }>,
  initialValue: T,
  deps: DependencyList = []
): UseApiResourceResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((res) => setData(res.data))
      .catch((err: any) => {
        setData(initialValue);
        setError(err?.response?.data?.message || err?.message || "Failed to load.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: load };
}
