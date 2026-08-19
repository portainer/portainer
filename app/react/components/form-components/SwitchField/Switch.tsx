import clsx from 'clsx';

import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { AutomationTestingProps } from '@/types';

import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import './Switch.css';

import styles from './Switch.module.css';

export interface Props extends AutomationTestingProps {
  checked: boolean;
  id: string;
  name: string;
  onChange(checked: boolean, index?: number): void;

  index?: number;
  className?: string;
  disabled?: boolean;
  featureId?: FeatureId;
}

export function Switch({
  name,
  checked,
  id,
  disabled,
  'data-cy': dataCy,
  onChange,
  index,
  featureId,
  className,
}: Props) {
  const limitedToBE = isLimitedToBE(featureId);

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- accessible text is provided by the parent SwitchField label */}
      <label
        className={clsx('switch', className, styles.root, {
          business: limitedToBE,
          limited: limitedToBE,
        })}
        data-cy={dataCy}
        aria-checked={checked}
      >
        <input
          type="checkbox"
          name={name}
          id={id}
          checked={checked}
          disabled={disabled || limitedToBE}
          onChange={({ target: { checked } }) => onChange(checked, index)}
        />
        <span className="slider round before:content-['']" />
      </label>
      {featureId && limitedToBE && <BEFeatureIndicator featureId={featureId} />}
    </>
  );
}
