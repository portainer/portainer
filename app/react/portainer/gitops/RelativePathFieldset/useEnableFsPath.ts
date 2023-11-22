import { useState } from 'react';

export function useEnableFsPath() {
  const [state, setState] = useState<number[]>([]);

  const enableFsPath0 = state.length && state[0] === 0;
  const enableFsPath1 = state.length && state[0] === 1;

  function toggleFsPath(idx: number, enable: boolean) {
    if (enable) {
      setState([...state, idx]);
    } else {
      setState(state.filter((e) => e !== idx));
    }
  }

  return { enableFsPath0, enableFsPath1, toggleFsPath };
}
