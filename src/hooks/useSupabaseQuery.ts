import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for Supabase queries with mock data fallback.
 * When the database has data, it's used. When empty or errored, falls back to mock.
 * This allows incremental migration from mock → real data.
 */
export function useSupabaseQuery<T>(
  table: string,
  mockData: T[],
  options?: {
    select?: string;
    orderBy?: string;
    orderAsc?: boolean;
    filters?: { column: string; value: unknown }[];
    limit?: number;
  }
): QueryResult<T> {
  const [data, setData] = useState<T[]>(mockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        let query = supabase
          .from(table)
          .select(options?.select ?? "*");

        if (options?.filters) {
          for (const f of options.filters) {
            query = query.eq(f.column, f.value);
          }
        }

        if (options?.orderBy) {
          query = query.order(options.orderBy, { ascending: options.orderAsc ?? false });
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data: rows, error: err } = await query;

        if (cancelled) return;

        if (err) {
          setError(err.message);
          setData(mockData); // fallback
        } else if (rows && rows.length > 0) {
          setData(rows as T[]);
          setError(null);
        } else {
          // Empty table — use mock data
          setData(mockData);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setData(mockData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [table, refetchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: () => setRefetchKey((k) => k + 1) };
}

/**
 * Hook for a single record by ID with mock fallback.
 */
export function useSupabaseRecord<T>(
  table: string,
  id: string | undefined,
  mockFinder: (id: string) => T | undefined,
  options?: { select?: string; idColumn?: string }
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        const { data: row, error: err } = await supabase
          .from(table)
          .select(options?.select ?? "*")
          .eq(options?.idColumn ?? "id", id!)
          .single();

        if (cancelled) return;

        if (err || !row) {
          // Fallback to mock
          const mock = mockFinder(id!);
          setData(mock ?? null);
          if (err) setError(err.message);
        } else {
          setData(row as T);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          const mock = mockFinder(id!);
          setData(mock ?? null);
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [table, id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
