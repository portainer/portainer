import { ComponentType } from 'react';
import clsx from 'clsx';
import { FormikErrors } from 'formik';

import { AddButton, Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import styles from './InputList.module.css';
import { arrayMove } from './utils';

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

type RenderItemFunction<T> = (
  item: T,
  onChange: (value: T) => void,
  error?: string | FormikErrors<T>
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
  errors?: FormikErrors<T>[] | string | string[];
  textTip?: string;
  isAddButtonHidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
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
}: Props<T>) {
  return (
    <div className={clsx('form-group', styles.root)}>
      <div className={clsx('col-sm-12', styles.header)}>
        <div className={clsx('control-label text-left', styles.label)}>
          {label}
          {tooltip && <Tooltip message={tooltip} />}
        </div>
        {!(isAddButtonHidden || readOnly) && (
          <AddButton
            label={addLabel}
            className="space-left"
            onClick={handleAdd}
            disabled={disabled}
          />
        )}
      </div>

      {textTip && (
        <div className="col-sm-12 mt-5">
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
                />
              ) : (
                renderItem(
                  item,
                  (value: T) => handleChangeItem(key, value),
                  error
                )
              )}
              <div className={clsx(styles.itemActions, 'items-start')}>
                {!readOnly && movable && (
                  <>
                    <Button
                      size="medium"
                      disabled={disabled || index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="vertical-center btn-only-icon"
                    >
                      <Icon icon="arrow-up" feather />
                    </Button>
                    <Button
                      size="medium"
                      type="button"
                      disabled={disabled || index === value.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="vertical-center btn-only-icon"
                    >
                      <Icon icon="arrow-down" feather />
                    </Button>
                  </>
                )}
                {!readOnly && (
                  <Button
                    color="dangerlight"
                    size="medium"
                    onClick={() => handleRemoveItem(key, item)}
                    className="vertical-center btn-only-icon"
                  >
                    <Icon icon="trash-2" feather size="md" />
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
      {error && <FormError>{error}</FormError>}
    </>
  );
}

function renderDefaultItem(
  item: DefaultType,
  onChange: (value: DefaultType) => void,
  error?: FormikErrors<DefaultType>
) {
  return <DefaultItem item={item} onChange={onChange} error={error} />;
}
