import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import type { Icon } from 'lucide-react';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import styles from './BoxOption.module.css';
import { BoxSelectorOption, Value } from './types';

interface Props<T extends Value> {
  radioName: string;
  option: BoxSelectorOption<T>;
  onSelect?(value: T): void;
  isSelected(value: T): boolean;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  type?: 'radio' | 'checkbox';
  checkIcon: Icon;
}

export function BoxOption<T extends Value>({
  radioName,
  option,
  onSelect = () => {},
  isSelected,
  disabled,
  tooltip,
  className,
  type = 'radio',
  children,
  checkIcon: Check,
}: PropsWithChildren<Props<T>>) {
  const selected = isSelected(option.value);

  const item = (
    <div className={clsx(styles.root, className)}>
      <input
        type={type}
        name={radioName}
        id={option.id}
        checked={selected}
        value={option.value.toString()}
        disabled={disabled}
        onChange={() => onSelect(option.value)}
      />

      <label htmlFor={option.id} data-cy={`${radioName}_${option.value}`}>
        {children}

        {!disabled && (
          <div
            className={clsx(
              'absolute top-4 right-4 flex h-4 w-4 items-center justify-center border border-solid  font-bold text-white',
              {
                'border-gray-6 bg-white': !selected,
                'border-blue-8 bg-blue-8': selected,
              },
              {
                'rounded-full': type === 'radio',
                'rounded-sm': type === 'checkbox',
              }
            )}
          >
            {selected && <Check className="lucide" strokeWidth={3} />}
          </div>
        )}
      </label>
    </div>
  );

  if (tooltip) {
    return <TooltipWithChildren message={tooltip}>{item}</TooltipWithChildren>;
  }

  return item;
}
