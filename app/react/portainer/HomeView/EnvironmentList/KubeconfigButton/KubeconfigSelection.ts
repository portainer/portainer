import { useState } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';

export function useSelection() {
  const [selection, setSelection] = useState<Record<EnvironmentId, boolean>>(
    {}
  );

  const selectionSize = Object.keys(selection).length;

  return { selection, toggle, selectionSize };

  function toggle(id: EnvironmentId, selected: boolean) {
    setSelection((prevSelection) => {
      const newSelection = { ...prevSelection };

      if (!selected) {
        delete newSelection[id];
      } else {
        newSelection[id] = true;
      }

      return newSelection;
    });
  }
}
