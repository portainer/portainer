import clsx from 'clsx';

import { isLimitedFeature } from '@/portainer/feature-flags/feature-flags.service';
import { BEFeatureIndicator } from '@/portainer/components/BEFeatureIndicator';
import { FeatureId } from '@/portainer/feature-flags/enums';

import './Switch.css';

import styles from './Switch.module.css';

export interface Props {
  checked: boolean;
  id: string;
  name: string;
  onChange(checked: boolean): void;

  className?: string;
  dataCy?: string;
  disabled?: boolean;
  featureId?: FeatureId;
}

export function Switch({
  name,
  checked,
  id,
  disabled,
  dataCy,
  onChange,
  featureId,
  className,
}: Props) {
  const limitedToBE = isLimitedFeature(featureId);

  return (
    <>
      <label
        className={clsx('switch', className, styles.root, {
          business: limitedToBE,
          limited: limitedToBE,
        })}
      >
        <input
          type="checkbox"
          name={name}
          id={id}
          checked={checked}
          disabled={disabled || limitedToBE}
          onChange={({ target: { checked } }) => onChange(checked)}
        />
        <i data-cy={dataCy} />
      </label>
      {limitedToBE && <BEFeatureIndicator featureId={featureId} />}
    </>
  );
}
