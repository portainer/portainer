import { ComponentType } from 'react';
import clsx from 'clsx';
import { FormikErrors } from 'formik';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@@/buttons';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import styles from './InputList.module.css';
import { arrayMove } from './utils';

type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export type ArrayError<T> =
  | FormikErrors<ArrElement<T>>[]
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
}
type Key = string | number;
type ChangeType = 'delete' | 'create' | 'update';
export type DefaultType = { value: string };

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
  error?: ItemError<T>
) => React.ReactNode;

interface Props<T> {
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
  errors?: ArrayError<T[]>;
  textTip?: string;
  isAddButtonHidden?: boolean;
  disabled?: boolean;
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
  errors,
  textTip,
  isAddButtonHidden = false,
  disabled,
  readOnly,
  'aria-label': ariaLabel,
}: Props<T>) {
  const isAddButtonVisible = !(isAddButtonHidden || readOnly);
  return (
    <div
      className={clsx('form-group', styles.root)}
      aria-label={ariaLabel || label}
    >
      {label && (
        <div className={clsx('col-sm-12', styles.header)}>
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
              <div
                key={key}
                className={clsx(
                  styles.itemLine,
                  { [styles.hasError]: !!error },
                  'vertical-center'
                )}
              >
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
                      />
                      <Button
                        size="medium"
                        type="button"
                        disabled={disabled || index === value.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="vertical-center btn-only-icon"
                        icon={ArrowDown}
                      />
                    </>
                  )}
                  {!readOnly && (
                    <Button
                      color="dangerlight"
                      size="medium"
                      onClick={() => handleRemoveItem(key, item)}
                      className="vertical-center btn-only-icon"
                      icon={Trash2}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddButtonVisible && (
        <div className="col-sm-12 mt-5">
          <Button
            onClick={handleAdd}
            disabled={disabled}
            type="button"
            color="default"
            className="!ml-0"
            size="small"
            icon={Plus}
          >
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );

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
}: ItemProps<DefaultType>) {
  return (
    <>
      <Input
        value={item.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className={styles.defaultItem}
        disabled={disabled}
        readOnly={readOnly}
      />
      {error && <FormError>{error}</FormError>}
    </>
  );
}

function renderDefaultItem(
  item: DefaultType,
  onChange: (value: DefaultType) => void,
  index: number,
  error?: ItemError<DefaultType>
) {
  return (
    <DefaultItem item={item} onChange={onChange} error={error} index={index} />
  );
}
