import { ReactNode } from 'react';

// allow custom labels
export interface RadioGroupOption<TValue> {
  value: TValue;
  label: ReactNode;
  disabled?: boolean;
}

interface Props<T extends string | number> {
  options: Array<RadioGroupOption<T>> | ReadonlyArray<RadioGroupOption<T>>;
  selectedOption: T;
  name: string;
  onOptionChange: (value: T) => void;
  groupClassName?: string;
  itemClassName?: string;
}

export function RadioGroup<T extends string | number = string>({
  options,
  selectedOption,
  name,
  onOptionChange,
  groupClassName,
  itemClassName,
}: Props<T>) {
  return (
    <div className={groupClassName ?? 'flex flex-wrap gap-x-2 gap-y-1'}>
      {options.map((option) => (
        <label
          key={option.value}
          className={
            itemClassName ??
            'control-label cursor-pointer !p-0 text-left font-normal'
          }
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedOption === option.value}
            onChange={() => onOptionChange(option.value)}
            style={{ margin: '0 4px 0 0' }}
            data-cy={`radio-${option.value}`}
            disabled={option.disabled}
            className="cursor-pointer"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
