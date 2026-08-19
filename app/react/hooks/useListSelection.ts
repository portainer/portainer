import { useState } from 'react';

export function useListSelection<T>(
  initialValue: Array<T> = [],
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b
) {
  const [selectedItems, setSelectedItems] = useState<Array<T>>(initialValue);

  function handleChangeSelect(currentItem: T, selected: boolean) {
    if (selected) {
      setSelectedItems((items) => [...items, currentItem]);
    } else {
      setSelectedItems((items) =>
        items.filter((item) => !compareFn(item, currentItem))
      );
    }
  }

  return [selectedItems, handleChangeSelect] as const;
}
