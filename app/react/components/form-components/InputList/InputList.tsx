import { ComponentType, useRef } from 'react';
import { FormikErrors } from 'formik';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { Button } from '@@/buttons';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

import { Input } from '../Input';
import { FormError } from '../FormError';

import { defaultItemBuilder } from './utils';
import { InputListActionButtons } from './ActionButtons';
import { DefaultType, Key, OnChangeEvent } from './types';
import { useInputList } from './useInputList';

export { useInputList } from './useInputList';

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

  index: number;
  needsDeletion?: boolean;
}

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
          <span className="control-label space-right pt-2 text-left">
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
              <div key={key} className="flex gap-1">
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
                <InputListActionButtons
                  index={index}
                  count={value.length}
                  movable={movable && !readOnly}
                  disabled={disabled}
                  showDelete={isDeleteButtonVisible}
                  canUndoDelete={canUndoDelete}
                  item={item}
                  initialItemsCount={initialItemsCount.current}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onDelete={() => handleRemoveItem(key, item)}
                  onToggleNeedsDeletion={(idx, itm) =>
                    toggleNeedsDeletion(key, itm)
                  }
                  data-cy={dataCy}
                />
              </div>
            );
          })}
        </div>
      )}

      {isAddButtonVisible && (
        <>
          <div className="col-sm-12 mt-5">
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
