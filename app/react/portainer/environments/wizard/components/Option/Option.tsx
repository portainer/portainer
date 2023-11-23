import clsx from 'clsx';
import { ComponentType } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

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
}

export function Option({
  icon,
  active,
  description,
  title,
  onClick = () => {},
  featureId,
}: Props) {
  const IconComponent = icon;
  const isLimited = isLimitedToBE(featureId);
  return (
    <button
      className={clsx(
        styles.root,
        isLimited ? styles.teaser : styles.feature,
        'border-0',
        {
          [styles.active]: active,
        }
      )}
      type="button"
      disabled={isLimited}
      onClick={onClick}
    >
      <div className="mt-2 flex items-end justify-center text-center">
        <IconComponent selected={active} className={styles.iconComponent} />
      </div>

      <div className="mt-3 flex flex-col text-center">
        <h3>{title}</h3>
        <h5>{description}</h5>
        {featureId && isLimited && (
          <BEFeatureIndicator
            showIcon={false}
            featureId={featureId}
            className="!whitespace-normal"
          />
        )}
      </div>
    </button>
  );
}
