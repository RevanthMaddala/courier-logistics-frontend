import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fn` on mount and whenever `deps` change; exposes { data, error, loading, reload }.
 * Responses from superseded calls are ignored so fast filter changes can't show stale data.
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const callId = useRef(0);

  const load = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn()
      .then((data) => {
        if (id === callId.current) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (id === callId.current) setState((s) => ({ ...s, error, loading: false }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

/** Wraps a mutating call with pending/error state for forms and action buttons. */
export function useMutation(fn) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setPending(false);
      }
    },
    [fn],
  );

  return { run, pending, error, setError };
}
