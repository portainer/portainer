import clsx from 'clsx';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { Tooltip } from '@@/Tip/Tooltip';

import styles from './SwitchField.module.css';
import { Switch } from './Switch';

export interface Props {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;

  name?: string;
  tooltip?: string;
  labelClass?: string;
  switchClass?: string;
  fieldClass?: string;
  dataCy?: string;
  disabled?: boolean;
  featureId?: FeatureId;
}

export function SwitchField({
  tooltip,
  checked,
  label,
  name,
  labelClass,
  fieldClass,
  dataCy,
  disabled,
  onChange,
  featureId,
  switchClass,
}: Props) {
  const toggleName = name ? `toggle_${name}` : '';

  return (
    <label className={clsx(styles.root, fieldClass)}>
      <span
        className={clsx(
          'text-left space-right control-label',
          styles.label,
          labelClass
        )}
      >
        {label}
        {tooltip && <Tooltip message={tooltip} />}
      </span>
      <Switch
        className={clsx('space-right', switchClass)}
        name={toggleName}
        id={toggleName}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        featureId={featureId}
        dataCy={dataCy}
      />
    </label>
  );
}
