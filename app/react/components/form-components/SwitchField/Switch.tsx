import clsx from 'clsx';

import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';
import { FeatureId } from '@/portainer/feature-flags/enums';

import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

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
  const limitedToBE = isLimitedToBE(featureId);

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
        <span className="slider round" data-cy={dataCy} />
      </label>
      {limitedToBE && <BEFeatureIndicator featureId={featureId} />}
    </>
  );
}
