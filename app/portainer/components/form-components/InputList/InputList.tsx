import { ComponentType } from 'react';
import clsx from 'clsx';
import { FormikErrors } from 'formik';

import { AddButton, Button } from '@/portainer/components/Button';
import { Tooltip } from '@/portainer/components/Tip/Tooltip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import styles from './InputList.module.css';
import { arrayMove } from './utils';

export type InputListError<T> = string | string[] | FormikErrors<T>[];

export interface ItemProps<T> {
  item: T;
  onChange(value: T): void;
  error?: string | FormikErrors<T>;
  disabled?: boolean;
  readOnly?: boolean;
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

interface Props<T> {
  label: string;
  value: T[];
  onChange(value: T[], e: OnChangeEvent<T>): void;
  itemBuilder?(): T;
  item?: ComponentType<ItemProps<T>>;
  tooltip?: string;
  addLabel?: string;
  itemKeyGetter?(item: T, index: number): Key;
  movable?: boolean;
  disabled?: boolean;
  errors?: InputListError<T>;
  readOnly?: boolean;
}

export function InputList<T = DefaultType>({
  label,
  value,
  onChange,
  itemBuilder = defaultItemBuilder as unknown as () => T,
  item = DefaultItem as unknown as ComponentType<ItemProps<T>>,
  tooltip,
  addLabel = 'Add item',
  itemKeyGetter = (item: T, index: number) => index,
  movable,
  errors,
  disabled,
  readOnly,
}: Props<T>) {
  const Item = item;

  return (
    <div className={clsx('form-group', styles.root)}>
      <div className={clsx('col-sm-12', styles.header)}>
        <div className={clsx('control-label text-left', styles.label)}>
          {label}
          {tooltip && <Tooltip message={tooltip} />}
        </div>
        {!readOnly && (
          <AddButton
            label={addLabel}
            className="space-left"
            onClick={handleAdd}
            disabled={disabled}
          />
        )}
      </div>

      <div className={clsx('col-sm-12 form-inline', styles.items)}>
        {value.map((item, index) => {
          const key = itemKeyGetter(item, index);
          const error = typeof errors === 'object' ? errors[index] : undefined;

          return (
            <div
              key={key}
              className={clsx(styles.itemLine, { [styles.hasError]: !!error })}
            >
              <Item
                item={item}
                onChange={(value: T) => handleChangeItem(key, value)}
                error={error}
                disabled={disabled}
                readOnly={readOnly}
              />
              <div className={styles.itemActions}>
                {!readOnly && movable && (
                  <>
                    <Button
                      size="small"
                      disabled={disabled || index === 0}
                      onClick={() => handleMoveUp(index)}
                    >
                      <i className="fa fa-arrow-up" aria-hidden="true" />
                    </Button>
                    <Button
                      size="small"
                      type="button"
                      disabled={disabled || index === value.length - 1}
                      onClick={() => handleMoveDown(index)}
                    >
                      <i className="fa fa-arrow-down" aria-hidden="true" />
                    </Button>
                  </>
                )}
                {!readOnly && (
                  <Button
                    color="danger"
                    size="small"
                    onClick={() => handleRemoveItem(key, item)}
                    disabled={disabled}
                  >
                    <i className="fa fa-trash" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
      <FormError>{error}</FormError>
    </>
  );
}
