import clsx from 'clsx';

import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import './Switch.css';

import styles from './Switch.module.css';

export interface Props {
  checked: boolean;
  id: string;
  name: string;
  onChange(checked: boolean, index?: number): void;

  index?: number;
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
  index,
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
          onChange={({ target: { checked } }) => onChange(checked, index)}
        />
        <span className="slider round before:content-['']" data-cy={dataCy} />
      </label>
      {limitedToBE && <BEFeatureIndicator featureId={featureId} />}
    </>
  );
}
