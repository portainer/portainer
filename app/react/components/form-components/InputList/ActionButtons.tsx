import {
  ArrowDownIcon,
  ArrowUpIcon,
  RotateCwIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button } from '@@/buttons';

import { hasKey } from './utils';
import { DefaultType, Key } from './types';

interface InputListActionButtonsProps<T = DefaultType> {
  index: number;
  count: number;
  movable?: boolean;
  disabled?: boolean;
  showDelete?: boolean;
  canUndoDelete?: boolean;
  item?: T;
  initialItemsCount?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onToggleNeedsDeletion?: (index: number, item: CanUndoDeleteItem<T>) => void;
  'data-cy'?: string;
}

export function InputListActionButtons<T = DefaultType>({
  index,
  count,
  movable = false,
  disabled = false,
  showDelete = true,
  canUndoDelete = false,
  item,
  initialItemsCount,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleNeedsDeletion,
  'data-cy': dataCy = '',
}: InputListActionButtonsProps<T>) {
  return (
    <div className="flex items-start gap-2">
      {movable && (
        <>
          <Button
            size="medium"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
            className="vertical-center btn-only-icon h-[34px]"
            icon={ArrowUpIcon}
            data-cy={`${dataCy}-move-up_${index}`}
          />
          <Button
            size="medium"
            type="button"
            disabled={disabled || index === count - 1}
            onClick={onMoveDown}
            className="vertical-center btn-only-icon h-[34px]"
            icon={ArrowDownIcon}
            data-cy={`${dataCy}-move-down_${index}`}
          />
        </>
      )}
      {showDelete && (
        <>
          {canUndoDelete &&
          item &&
          initialItemsCount !== undefined &&
          onToggleNeedsDeletion &&
          hasKey(item, 'needsDeletion') ? (
            <CanUndoDeleteButton
              item={{ ...item, needsDeletion: !!item.needsDeletion }}
              itemIndex={index}
              initialItemsCount={initialItemsCount}
              handleRemoveItem={onDelete}
              handleToggleNeedsDeletion={onToggleNeedsDeletion}
              dataCy={`${dataCy}RemoveButton_${index}`}
              disabled={disabled}
            />
          ) : (
            <Button
              color="dangerlight"
              size="medium"
              onClick={onDelete}
              className="vertical-center btn-only-icon h-[34px]"
              data-cy={`${dataCy}RemoveButton_${index}`}
              icon={Trash2Icon}
              disabled={disabled}
              aria-label="Remove item"
              title="Remove item"
            />
          )}
        </>
      )}
    </div>
  );
}

export type CanUndoDeleteItem<T> = T & { needsDeletion: boolean };

type CanUndoDeleteButtonProps<T> = {
  item: CanUndoDeleteItem<T>;
  itemIndex: number;
  initialItemsCount: number;
  handleRemoveItem(key: Key, item: T): void;
  handleToggleNeedsDeletion(key: Key, item: T): void;
  dataCy: string;
  disabled?: boolean;
};

function CanUndoDeleteButton<T>({
  item,
  itemIndex,
  initialItemsCount,
  handleRemoveItem,
  handleToggleNeedsDeletion,
  disabled,
  dataCy,
}: CanUndoDeleteButtonProps<T>) {
  // if the item is new, we can just remove it, otherwise we need to toggle the needsDeletion flag
  function handleDeleteClick() {
    if (itemIndex < initialItemsCount) {
      handleToggleNeedsDeletion(itemIndex, item);
    } else {
      handleRemoveItem(itemIndex, item);
    }
  }

  return (
    <>
      {!item.needsDeletion && (
        <Button
          color="dangerlight"
          size="medium"
          onClick={handleDeleteClick}
          className="vertical-center btn-only-icon h-[34px]"
          icon={Trash2Icon}
          data-cy={`${dataCy}_delete`}
          disabled={disabled}
        />
      )}
      {item.needsDeletion && (
        <Button
          color="default"
          size="medium"
          onClick={handleDeleteClick}
          className="vertical-center btn-only-icon h-[34px]"
          icon={RotateCwIcon}
          data-cy={`${dataCy}_undo_delete`}
          disabled={disabled}
        />
      )}
    </>
  );
}
