import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { ButtonGroup, Size } from '@@/buttons/ButtonGroup';
import { Button } from '@@/buttons';

import styles from './ButtonSelector.module.css';

export interface Option<T> {
  value: T;
  label?: ReactNode;
}

interface Props<T> {
  value: T;
  onChange(value: T): void;
  options: Option<T>[];
  size?: Size;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function ButtonSelector<T extends string | number>({
  value,
  onChange,
  size,
  options,
  disabled,
  readOnly,
  className,
}: Props<T>) {
  return (
    <ButtonGroup size={size} className={clsx(styles.group, className)}>
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
    <Button
      color="light"
      as="label"
      disabled={disabled || readOnly}
      className={clsx(
        {
          active: selected,
        },
        '!static !z-auto'
      )}
    >
      {children}
      <input
        type="radio"
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    </Button>
  );
}
