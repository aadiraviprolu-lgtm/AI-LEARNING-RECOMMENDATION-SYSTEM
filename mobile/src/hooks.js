import { useCallback, useEffect, useState } from 'react';

/** Loader with loading / refreshing (pull-to-refresh) / error state. */
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: '' });

  const run = useCallback(async (isRefresh = false) => {
    setState((s) => ({ ...s, loading: !isRefresh && !s.data, refreshing: isRefresh, error: '' }));
    try { const data = await loader(); setState({ data, loading: false, refreshing: false, error: '' }); }
    catch (e) { setState((s) => ({ ...s, loading: false, refreshing: false, error: e.message })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, reload: () => run(false), refresh: () => run(true) };
}

export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}
