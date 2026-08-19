import clsx from 'clsx';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import { ButtonGroup, Size } from '@@/buttons/ButtonGroup';
import { Button } from '@@/buttons';

import styles from './ButtonSelector.module.css';

export interface Option<T> {
  value: T;
  label?: ReactNode;
  disabled?: boolean;
  icon?: ComponentProps<typeof Button>['icon'];
}

interface Props<T> {
  value: T;
  onChange(value: T): void;
  options: Option<T>[];
  size?: Size;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function ButtonSelector<T extends string | number | boolean>({
  value,
  onChange,
  size,
  options,
  disabled,
  readOnly,
  className,
  'aria-label': ariaLabel,
}: Props<T>) {
  return (
    <ButtonGroup
      size={size}
      className={clsx(styles.group, className)}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <OptionItem
          key={option.value.toString()}
          data-cy={`button-selector-option-${option.value}`}
          selected={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={disabled || option.disabled}
          readOnly={readOnly}
          icon={option.icon}
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
  icon?: ComponentProps<typeof Button>['icon'];
}

function OptionItem({
  selected,
  children,
  onChange,
  disabled,
  readOnly,
  'data-cy': dataCy,
  icon,
}: PropsWithChildren<OptionItemProps> & AutomationTestingProps) {
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
      data-cy={dataCy}
      icon={icon}
    >
      {children}
      <input
        type="radio"
        data-cy={`${dataCy}-radio-input`}
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    </Button>
  );
}
