import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { ButtonGroup, Size } from '../../Button/ButtonGroup';

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
}

export function ButtonSelector<T extends string | number>({
  value,
  onChange,
  size,
  options,
}: Props<T>) {
  return (
    <ButtonGroup size={size} className={styles.group}>
      {options.map((option) => (
        <OptionItem
          key={option.value}
          selected={value === option.value}
          onChange={() => onChange(option.value)}
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
}

function OptionItem({
  selected,
  children,
  onChange,
}: PropsWithChildren<OptionItemProps>) {
  return (
    <label className={clsx('btn btn-primary', { active: selected })}>
      {children}
      <input type="radio" checked={selected} onChange={onChange} />
    </label>
  );
}
