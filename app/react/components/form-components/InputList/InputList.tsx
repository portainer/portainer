import { ComponentType, useRef } from 'react';
import { FormikErrors } from 'formik';
import { ArrowDown, ArrowUp, Plus, RotateCw, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { Button } from '@@/buttons';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import { arrayMove, hasKey } from './utils';

type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export type ArrayError<TArray> =
  | Array<FormikErrors<ArrElement<TArray> | undefined>>
  | string
  | string[]
  | undefined;
export type ItemError<T> = FormikErrors<T> | string | undefined;

export interface ItemProps<T> {
  item: T;
  onChange(value: T): void;
  error?: ItemError<T>;
  disabled?: boolean;
  readOnly?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  needsDeletion?: boolean;
}
type Key = string | number;
type ChangeType = 'delete' | 'create' | 'update';
export type DefaultType = { value: string; needsDeletion?: boolean };
type CanUndoDeleteItem<T> = T & { needsDeletion: boolean };

type OnChangeEvent<T> =
  | {
      item: T;
      type: ChangeType;
    }
  | {
      type: 'move';
      fromIndex: number;
      to: number;
    };

type RenderItemFunction<T> = (
  item: T,
  onChange: (value: T) => void,
  index: number,
  dataCy: string,
  error?: ItemError<T>
) => React.ReactNode;

interface Props<T> extends AutomationTestingProps {
  label?: string;
  value: T[];
  onChange(value: T[], e: OnChangeEvent<T>): void;
  itemBuilder?(): T;
  renderItem?: RenderItemFunction<T>;
  item?: ComponentType<ItemProps<T>>;
  tooltip?: string;
  addLabel?: string;
  itemKeyGetter?(item: T, index: number): Key;
  movable?: boolean;
  canUndoDelete?: boolean;
  errors?: ArrayError<T[]>;
  textTip?: string;
  isAddButtonHidden?: boolean;
  isDeleteButtonHidden?: boolean;
  disabled?: boolean;
  addButtonError?: string;
  readOnly?: boolean;
  'aria-label'?: string;
}

export function InputList<T = DefaultType>({
  label,
  value,
  onChange,
  itemBuilder = defaultItemBuilder as unknown as () => T,
  renderItem = renderDefaultItem as unknown as RenderItemFunction<T>,
  item: Item,
  tooltip,
  addLabel = 'Add item',
  itemKeyGetter = (item: T, index: number) => index,
  movable,
  canUndoDelete = false,
  errors,
  textTip,
  isAddButtonHidden = false,
  isDeleteButtonHidden = false,
  'data-cy': dataCy,
  disabled,
  addButtonError,
  readOnly,
  'aria-label': ariaLabel,
}: Props<T>) {
  const initialItemsCount = useRef(value.length);
  const isAddButtonVisible = !(isAddButtonHidden || readOnly);
  const isDeleteButtonVisible = !(isDeleteButtonHidden || readOnly);
  const {
    handleMoveUp,
    handleMoveDown,
    handleRemoveItem,
    handleAdd,
    handleChangeItem,
    toggleNeedsDeletion,
  } = useInputList<T>({
    value,
    onChange,
    itemBuilder,
    itemKeyGetter,
    movable,
  });

  return (
    <div className="form-group" aria-label={ariaLabel || label}>
      {label && (
        <div className="col-sm-12">
          <span className="control-label space-right pt-2 text-left !font-bold">
            {label}
            {tooltip && <Tooltip message={tooltip} />}
          </span>
        </div>
      )}

      {textTip && (
        <div className="col-sm-12 mt-5">
          <TextTip color="blue">{textTip}</TextTip>
        </div>
      )}

      {value.length > 0 && (
        <div className="col-sm-12 mt-5 flex flex-col gap-y-5">
          {value.map((item, index) => {
            const key = itemKeyGetter(item, index);
            const error =
              typeof errors === 'object' ? errors[index] : undefined;

            return (
              <div key={key} className="flex">
                {Item ? (
                  <Item
                    item={item}
                    onChange={(value: T) => handleChangeItem(key, value)}
                    error={error}
                    disabled={disabled}
                    readOnly={readOnly}
                    index={index}
                  />
                ) : (
                  renderItem(
                    item,
                    (value: T) => handleChangeItem(key, value),
                    index,
                    dataCy,
                    error
                  )
                )}
                <div className="items-start">
                  {!readOnly && movable && (
                    <>
                      <Button
                        size="medium"
                        disabled={disabled || index === 0}
                        onClick={() => handleMoveUp(index)}
                        className="vertical-center btn-only-icon"
                        icon={ArrowUp}
                        data-cy={`${dataCy}-move-up_${index}`}
                      />
                      <Button
                        size="medium"
                        type="button"
                        disabled={disabled || index === value.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="vertical-center btn-only-icon"
                        icon={ArrowDown}
                        data-cy={`${dataCy}-move-down_${index}`}
                      />
                    </>
                  )}
                  {isDeleteButtonVisible && !canUndoDelete && (
                    <Button
                      color="dangerlight"
                      size="medium"
                      onClick={() => handleRemoveItem(key, item)}
                      className="vertical-center btn-only-icon"
                      data-cy={`${dataCy}RemoveButton_${index}`}
                      icon={Trash2}
                    />
                  )}
                  {isDeleteButtonVisible &&
                    canUndoDelete &&
                    hasKey(item, 'needsDeletion') && (
                      <CanUndoDeleteButton
                        item={{ ...item, needsDeletion: !!item.needsDeletion }}
                        itemIndex={index}
                        initialItemsCount={initialItemsCount.current}
                        handleRemoveItem={handleRemoveItem}
                        handleToggleNeedsDeletion={toggleNeedsDeletion}
                        dataCy={`${dataCy}RemoveButton_${index}`}
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddButtonVisible && (
        <>
          <div className="col-sm-12 mt-7">
            <Button
              onClick={handleAdd}
              disabled={disabled}
              type="button"
              color="default"
              className="!ml-0"
              size="small"
              icon={Plus}
              data-cy={`${dataCy}AddButton`}
            >
              {addLabel}
            </Button>
          </div>
          {addButtonError && (
            <div className="col-sm-12 mt-1">
              <TextTip color="blue">{addButtonError}</TextTip>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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

function defaultItemBuilder(): DefaultType {
  return { value: '' };
}

function DefaultItem({
  item,
  onChange,
  error,
  disabled,
  readOnly,
  index,
  'data-cy': dataCy,
}: ItemProps<DefaultType> & AutomationTestingProps) {
  return (
    <>
      <Input
        value={item.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className={clsx('!w-full', item.needsDeletion && 'striked')}
        disabled={disabled || item.needsDeletion}
        readOnly={readOnly}
        data-cy={`${dataCy}RemoveButton_${index}`}
      />
      {error && <FormError>{error}</FormError>}
    </>
  );
}

function renderDefaultItem(
  item: DefaultType,
  onChange: (value: DefaultType) => void,
  index: number,
  dataCy: string,
  error?: ItemError<DefaultType>
) {
  return (
    <DefaultItem
      item={item}
      onChange={onChange}
      error={error}
      index={index}
      data-cy={dataCy}
    />
  );
}

type CanUndoDeleteButtonProps<T> = {
  item: CanUndoDeleteItem<T>;
  itemIndex: number;
  initialItemsCount: number;
  handleRemoveItem(key: Key, item: T): void;
  handleToggleNeedsDeletion(key: Key, item: T): void;
  dataCy: string;
};

function CanUndoDeleteButton<T>({
  item,
  itemIndex,
  initialItemsCount,
  handleRemoveItem,
  handleToggleNeedsDeletion,
  dataCy,
}: CanUndoDeleteButtonProps<T>) {
  return (
    <div className="items-start">
      {!item.needsDeletion && (
        <Button
          color="dangerlight"
          size="medium"
          onClick={handleDeleteClick}
          className="vertical-center btn-only-icon"
          icon={Trash2}
          data-cy={`${dataCy}_delete`}
        />
      )}
      {item.needsDeletion && (
        <Button
          color="default"
          size="medium"
          onClick={handleDeleteClick}
          className="vertical-center btn-only-icon"
          icon={RotateCw}
          data-cy={`${dataCy}_undo_delete`}
        />
      )}
    </div>
  );

  // if the item is new, we can just remove it, otherwise we need to toggle the needsDeletion flag
  function handleDeleteClick() {
    if (itemIndex < initialItemsCount) {
      handleToggleNeedsDeletion(itemIndex, item);
    } else {
      handleRemoveItem(itemIndex, item);
    }
  }
}
