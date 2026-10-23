import clsx from 'clsx';

import { FormError } from '@@/form-components/FormError';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { BoxSelectorItem } from './BoxSelectorItem';
import { BoxSelectorOption, Value } from './types';

interface IsMultiProps<T extends Value> {
  isMulti: true;
  value: T[];
  onChange(value: T[], limitedToBE: boolean): void;
}

interface SingleProps<T extends Value> {
  isMulti?: never;
  value: T;
  onChange(value: T, limitedToBE: boolean): void;
}

type Union<T extends Value> = IsMultiProps<T> | SingleProps<T>;

export type Props<T extends Value> = Union<T> & {
  radioName: string;
  options: ReadonlyArray<BoxSelectorOption<T>> | Array<BoxSelectorOption<T>>;
  slim?: boolean;
  hiddenSpacingCount?: number;
  error?: string;
  useGridLayout?: boolean;
  className?: string;
  label?: string;
  'aria-label'?: string;
};

export function BoxSelector<T extends Value>({
  radioName,
  options,
  slim = false,
  hiddenSpacingCount,
  error,
  useGridLayout,
  className,
  label,
  'aria-label': ariaLabel,
  ...props
}: Props<T>) {
  const rootClassName = clsx(
    useGridLayout
      ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'mb-1 mt-1 flex w-full flex-wrap gap-2.5 overflow-hidden',
    className
  );

  return (
    <>
      {!!label && <FormSectionTitle>{label}</FormSectionTitle>}
      <div className='form-group after:clear-both after:table after:content-[""]'>
        <div className="col-sm-12">
          <div
            className={rootClassName}
            role={props.isMulti ? 'group' : 'radiogroup'}
            aria-label={ariaLabel ?? label}
          >
            {options
              .filter((option) => !option.hide)
              .map(({ disabled, ...option }) => (
                <BoxSelectorItem
                  key={option.id}
                  radioName={radioName}
                  option={option}
                  onSelect={handleSelect}
                  disabled={
                    typeof disabled === 'function' ? disabled() : disabled
                  }
                  tooltip={option.tooltip && option.tooltip()}
                  type={props.isMulti ? 'checkbox' : 'radio'}
                  isSelected={isSelected}
                  slim={slim}
                />
              ))}
            {hiddenSpacingCount &&
              Array.from(Array(hiddenSpacingCount)).map((_, index) => (
                <div key={index} className="flex-1" />
              ))}
          </div>
          {!!error && <FormError>{error}</FormError>}
        </div>
      </div>
    </>
  );

  function handleSelect(optionValue: T, limitedToBE: boolean) {
    if (props.isMulti) {
      const newValue = isSelected(optionValue)
        ? props.value.filter((v) => v !== optionValue)
        : [...props.value, optionValue];
      props.onChange(newValue, limitedToBE);
      return;
    }

    if (isSelected(optionValue)) {
      return;
    }

    props.onChange(optionValue, limitedToBE);
  }

  function isSelected(optionValue: T) {
    if (props.isMulti) {
      return props.value.includes(optionValue);
    }

    return props.value === optionValue;
  }
}
