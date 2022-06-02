import clsx from 'clsx';
import { ComponentType } from 'react';

import { BEFeatureIndicator } from '@/portainer/components/BEFeatureIndicator';
import { FeatureId } from '@/portainer/feature-flags/enums';
import { WizardTileType } from '@/react/portainer/environments/wizard/EnvironmentTypeSelectView/environment-types';

import styles from './Option.module.css';

export interface SelectorItemType {
  icon: string | ComponentType<{ selected?: boolean; className?: string }>;
  title: string;
  description: string;
}

interface Props extends SelectorItemType {
  active?: boolean;
  onClick?(): void;
  featureId?: FeatureId;
  type?: WizardTileType;
  disabled?: boolean;
}

export function Option({
  icon,
  active,
  description,
  title,
  onClick = () => {},
  type = WizardTileType.FEATURE,
  disabled = false,
  featureId,
}: Props) {
  const Icon = typeof icon !== 'string' ? icon : null;

  return (
    <button
      className={clsx(
        styles.optionTile,
        type === WizardTileType.FEATURE ? styles.feature : styles.teaser,
        'border-0',
        {
          [styles.active]: active,
        }
      )}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <div className="text-center mt-2">
        {Icon ? (
          <Icon selected={active} className={styles.iconComponent} />
        ) : (
          <i className={clsx(icon, 'block', styles.icon)} />
        )}
      </div>

      <div className="mt-3 text-center flex flex-col">
        <h3>{title}</h3>
        <h5>{description}</h5>
        {type === 'teaser' && (
          <BEFeatureIndicator
            showIcon={false}
            featureId={featureId}
            classes="!whitespace-normal"
          />
        )}
      </div>
    </button>
  );
}
