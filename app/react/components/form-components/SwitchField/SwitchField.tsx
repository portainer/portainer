import clsx from 'clsx';
import uuid from 'uuid';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';

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
  valueExplanation?: ReactNode;
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
  valueExplanation,
}: PropsWithChildren<Props>) {
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
      {valueExplanation && <span>{valueExplanation}</span>}
    </div>
  );
}
