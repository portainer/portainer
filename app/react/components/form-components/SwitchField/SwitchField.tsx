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
  dataCy,
  disabled,
  onChange,
  featureId,
}: Props) {
  const toggleName = name ? `toggle_${name}` : '';

  return (
    <label className={styles.root}>
      <span
        className={clsx(
          'control-label text-left space-right',
          styles.label,
          labelClass
        )}
      >
        {label}
        {tooltip && <Tooltip position="bottom" message={tooltip} />}
      </span>
      <Switch
        className="space-right"
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
