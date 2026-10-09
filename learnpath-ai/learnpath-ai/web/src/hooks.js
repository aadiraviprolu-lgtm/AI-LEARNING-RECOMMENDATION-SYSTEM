import { useCallback, useEffect, useState } from 'react';

export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

/** Runs an async loader whenever deps change; exposes loading / error / reload. */
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    loader()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
