import clsx from 'clsx';
import { ComponentProps } from 'react';
import uuid from 'uuid';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Tooltip } from '@@/Tip/Tooltip';

import styles from './SwitchField.module.css';
import { Switch } from './Switch';

export interface Props {
  label: string;
  checked: boolean;
  onChange(value: boolean, index?: number): void;

  index?: number;
  name?: string;
  tooltip?: ComponentProps<typeof Tooltip>['message'];
  setTooltipHtmlMessage?: ComponentProps<typeof Tooltip>['setHtmlMessage'];
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
  index,
  name = uuid(),
  labelClass,
  fieldClass,
  dataCy,
  disabled,
  onChange,
  featureId,
  switchClass,
  setTooltipHtmlMessage,
}: Props) {
  const toggleName = name ? `toggle_${name}` : '';

  return (
    <div className={clsx(styles.root, fieldClass)}>
      <label
        className={clsx('space-right control-label !p-0 text-left', labelClass)}
        htmlFor={toggleName}
      >
        {label}
        {tooltip && (
          <Tooltip message={tooltip} setHtmlMessage={setTooltipHtmlMessage} />
        )}
      </label>
      <Switch
        className={clsx('space-right', switchClass)}
        name={toggleName}
        id={toggleName}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        index={index}
        featureId={featureId}
        dataCy={dataCy}
      />
    </div>
  );
}
