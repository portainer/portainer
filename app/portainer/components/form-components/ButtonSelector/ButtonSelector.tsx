import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { ButtonGroup, Size } from '../../Button/ButtonGroup';

import styles from './ButtonSelector.module.css';

export interface Option<T> {
  value: T;
  label?: string;
}

interface Props<T> {
  value: T;
  onChange(value: T): void;
  options: Option<T>[];
  size?: Size;
  disabled?: boolean;
  readOnly?: boolean;
}

export function ButtonSelector<T extends string | number>({
  value,
  onChange,
  size,
  options,
  disabled,
  readOnly,
}: Props<T>) {
  return (
    <ButtonGroup size={size} className={styles.group}>
      {options.map((option) => (
        <OptionItem
          key={option.value}
          selected={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={disabled}
          readOnly={readOnly}
        >
          {option.label || option.value.toString()}
        </OptionItem>
      ))}
    </ButtonGroup>
  );
}

interface OptionItemProps {
  selected: boolean;
  onChange(): void;
  disabled?: boolean;
  readOnly?: boolean;
}

function OptionItem({
  selected,
  children,
  onChange,
  disabled,
  readOnly,
}: PropsWithChildren<OptionItemProps>) {
  return (
    <label
      className={clsx('btn btn-primary', {
        active: selected,
        disabled: readOnly || disabled,
      })}
    >
      {children}
      <input
        type="radio"
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    </label>
  );
}
