import { CanUndoDeleteItem } from './ActionButtons';
import { DefaultType, Key, OnChangeEvent } from './types';
import { arrayMove, defaultItemBuilder } from './utils';

export function useInputList<T = DefaultType>({
  value,
  onChange,
  itemBuilder = defaultItemBuilder as unknown as () => T,
  itemKeyGetter = (item: T, index: number) => index,
  movable = false,
}: {
  value: T[];
  onChange(value: T[], e: OnChangeEvent<T>): void;
  itemBuilder?(): T;
  itemKeyGetter?(item: T, index: number): Key;
  movable?: boolean;
}) {
  function handleMoveUp(index: number) {
    if (index <= 0) {
      return;
    }
    handleMove(index, index - 1);
  }

  function handleMoveDown(index: number) {
    if (index >= value.length - 1) {
      return;
    }
    handleMove(index, index + 1);
  }

  function handleMove(from: number, to: number) {
    if (!movable) {
      return;
    }

    onChange(arrayMove(value, from, to), {
      type: 'move',
      fromIndex: from,
      to,
    });
  }

  function handleRemoveItem(key: Key, item: T) {
    onChange(
      value.filter((item, index) => {
        const itemKey = itemKeyGetter(item, index);
        return itemKey !== key;
      }),
      { type: 'delete', item }
    );
  }

  function toggleNeedsDeletion(key: Key, item: CanUndoDeleteItem<T>) {
    handleChangeItem(key, { ...item, needsDeletion: !item.needsDeletion });
  }

  function handleAdd() {
    const newItem = itemBuilder();
    onChange([...value, newItem], { type: 'create', item: newItem });
  }

  function handleChangeItem(key: Key, newItemValue: T) {
    const newItems = value.map((item, index) => {
      const itemKey = itemKeyGetter(item, index);
      if (itemKey !== key) {
        return item;
      }
      return newItemValue;
    });
    onChange(newItems, {
      type: 'update',
      item: newItemValue,
    });
  }

  return {
    handleMoveUp,
    handleMoveDown,
    handleRemoveItem,
    handleAdd,
    handleChangeItem,
    toggleNeedsDeletion,
  };
}
