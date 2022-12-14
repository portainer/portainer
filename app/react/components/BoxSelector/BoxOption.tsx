import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { Tooltip } from '@@/Tip/Tooltip';

import './BoxSelectorItem.css';

import { BoxSelectorOption } from './types';

interface Props<T extends number | string> {
  radioName: string;
  option: BoxSelectorOption<T>;
  onChange?(value: T): void;
  selectedValue: T;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  type?: 'radio' | 'checkbox';
}

export function BoxOption<T extends number | string>({
  radioName,
  option,
  onChange = () => {},
  selectedValue,
  disabled,
  tooltip,
  className,
  type = 'radio',
  children,
}: PropsWithChildren<Props<T>>) {
  return (
    <div className={clsx('box-selector-item', className)}>
      <input
        type={type}
        name={radioName}
        id={option.id}
        checked={option.value === selectedValue}
        value={option.value}
        disabled={disabled}
        onChange={() => onChange(option.value)}
      />

      <label htmlFor={option.id} data-cy={`${radioName}_${option.value}`}>
        {children}
      </label>
      {tooltip && (
        <Tooltip
          position="bottom"
          className="portainer-tooltip"
          message={tooltip}
        />
      )}
    </div>
  );
}
