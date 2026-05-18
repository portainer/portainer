import { useState } from 'react';

let idCounter = 0;

/**
 * Generates a stable unique ID per component instance.
 * Replace with React.useId() after upgrading to React 18.
 */
export function useId() {
  const [id] = useState(() => `ps-id-${++idCounter}`);
  return id;
}
