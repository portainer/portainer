import clsx from 'clsx';

import type { FeatureId } from '@/portainer/feature-flags/enums';

import './BoxSelector.css';
import styles from './BoxSelector.module.css';
import { BoxSelectorItem } from './BoxSelectorItem';
import { BoxSelectorOption } from './types';

export interface Props<T extends number | string> {
  radioName: string;
  value: T;
  onChange(value: T, limitedToBE: boolean): void;
  options: BoxSelectorOption<T>[];
}

export function BoxSelector<T extends number | string>({
  radioName,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <div className={clsx('boxselector_wrapper', styles.root)}>
      {options.map((option) => (
        <BoxSelectorItem
          key={option.id}
          radioName={radioName}
          option={option}
          onChange={onChange}
          selectedValue={value}
          disabled={option.disabled && option.disabled()}
          tooltip={option.tooltip && option.tooltip()}
        />
      ))}
    </div>
  );
}

export function buildOption<T extends number | string>(
  id: string,
  icon: string,
  label: string,
  description: string,
  value: T,
  feature: FeatureId
): BoxSelectorOption<T> {
  return { id, icon, label, description, value, feature };
}
