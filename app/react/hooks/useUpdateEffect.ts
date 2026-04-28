import { useEffect, useRef } from 'react';

/**
 * Like `useEffect`, but skips the callback on the initial render.
 * Only runs when a dependency changes after the component has mounted.
 */
export function useUpdateEffect(
  fn: () => void,
  deps: React.DependencyList
): void {
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
