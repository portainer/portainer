import { ComponentType } from 'react';
import clsx from 'clsx';

import { AddButton, Button } from '@@/buttons';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import styles from './InputList.module.css';
import { arrayMove } from './utils';

export type InputListError<T> = Record<keyof T, string>;

export interface ItemProps<T> {
  item: T;
  onChange(value: T): void;
  error?: InputListError<T>;
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
  error?: InputListError<T>
) => React.ReactNode;

interface Props<T> {
  label: string;
  value: T[];
  onChange(value: T[], e: OnChangeEvent<T>): void;
  itemBuilder?(): T;
  renderItem?: RenderItemFunction<T>;
  item?: ComponentType<ItemProps<T>>;
  tooltip?: string;
  addLabel?: string;
  itemKeyGetter?(item: T, index: number): Key;
  movable?: boolean;
  errors?: InputListError<T>[] | string;
  textTip?: string;
  isAddButtonHidden?: boolean;
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
}: Props<T>) {
  return (
    <div className={clsx('form-group', styles.root)}>
      <div className={clsx('col-sm-12', styles.header)}>
        <div className={clsx('control-label text-left', styles.label)}>
          {label}
          {tooltip && <Tooltip message={tooltip} />}
        </div>
        {!isAddButtonHidden && (
          <AddButton
            label={addLabel}
            className="space-left"
            onClick={handleAdd}
          />
        )}
      </div>

      {textTip && (
        <div className="col-sm-12 my-5">
          <TextTip color="blue">{textTip}</TextTip>
        </div>
      )}

      <div className={clsx('col-sm-12', styles.items, 'space-y-4')}>
        {value.map((item, index) => {
          const key = itemKeyGetter(item, index);
          const error = typeof errors === 'object' ? errors[index] : undefined;

          return (
            <div
              key={key}
              className={clsx(styles.itemLine, { [styles.hasError]: !!error })}
            >
              {Item ? (
                <Item
                  item={item}
                  onChange={(value: T) => handleChangeItem(key, value)}
                  error={error}
                />
              ) : (
                renderItem(
                  item,
                  (value: T) => handleChangeItem(key, value),
                  error
                )
              )}
              <div className={clsx(styles.itemActions, 'items-start')}>
                {movable && (
                  <>
                    <Button
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                    >
                      <i className="fa fa-arrow-up" aria-hidden="true" />
                    </Button>
                    <Button
                      size="small"
                      type="button"
                      disabled={index === value.length - 1}
                      onClick={() => handleMoveDown(index)}
                    >
                      <i className="fa fa-arrow-down" aria-hidden="true" />
                    </Button>
                  </>
                )}
                <Button
                  color="danger"
                  size="small"
                  onClick={() => handleRemoveItem(key, item)}
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </Button>
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

function DefaultItem({ item, onChange, error }: ItemProps<DefaultType>) {
  return (
    <>
      <Input
        value={item.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className={styles.defaultItem}
      />
      {error && <FormError>{error}</FormError>}
    </>
  );
}

function renderDefaultItem(
  item: DefaultType,
  onChange: (value: DefaultType) => void,
  error?: InputListError<DefaultType>
) {
  return <DefaultItem item={item} onChange={onChange} error={error} />;
}
