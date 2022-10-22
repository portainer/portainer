import clsx from 'clsx';
import { ComponentType } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@@/Icon';
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
  const IconComponent = typeof icon !== 'string' ? icon : null;
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
      <div className="flex items-end justify-center text-center mt-2">
        {IconComponent ? (
          <IconComponent selected={active} className={styles.iconComponent} />
        ) : (
          <Icon
            icon={icon}
            className={clsx(
              'block',
              icon === 'svg-dockericon' ? styles.iconLarge : styles.icon
            )}
          />
        )}
      </div>

      <div className="mt-3 text-center flex flex-col">
        <h3>{title}</h3>
        <h5>{description}</h5>
        {isLimited && (
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
