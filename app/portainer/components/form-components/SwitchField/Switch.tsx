import clsx from 'clsx';

import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';
import { BEFeatureIndicator } from '@/portainer/components/BEFeatureIndicator';
import { FeatureId } from '@/portainer/feature-flags/enums';
import { r2a } from '@/react-tools/react2angular';

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
        <i data-cy={dataCy} />
      </label>
      {limitedToBE && <BEFeatureIndicator featureId={featureId} />}
    </>
  );
}

export const SwitchAngular = r2a(Switch, [
  'name',
  'checked',
  'id',
  'disabled',
  'dataCy',
  'onChange',
  'feature',
  'className',
]);
