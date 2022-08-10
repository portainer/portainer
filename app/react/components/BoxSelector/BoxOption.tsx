import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import ReactTooltip from 'react-tooltip';

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
  const tooltipId = `box-option-${radioName}-${option.id}`;
  return (
    <div
      className={clsx('box-selector-item', className)}
      data-tip
      data-for={tooltipId}
      tooltip-append-to-body="true"
      tooltip-placement="bottom"
      tooltip-class="portainer-tooltip"
    >
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
        <ReactTooltip
          place="bottom"
          className="portainer-tooltip"
          id={tooltipId}
        >
          {tooltip}
        </ReactTooltip>
      )}
    </div>
  );
}
