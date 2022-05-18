import clsx from 'clsx';
import { ComponentType } from 'react';

import styles from './Option.module.css';

export interface SelectorItemType {
  icon: string | ComponentType<{ selected?: boolean; className?: string }>;
  title: string;
  description: string;
}

interface Props extends SelectorItemType {
  active?: boolean;
  onClick?(): void;
}

export function Option({
  icon,
  active,
  description,
  title,
  onClick = () => {},
}: Props) {
  const Icon = typeof icon !== 'string' ? icon : null;

  return (
    <button
      className={clsx('border-0', styles.root, { [styles.active]: active })}
      type="button"
      onClick={onClick}
    >
      <div className="text-center mt-2">
        {Icon ? (
          <Icon selected={active} className={styles.iconComponent} />
        ) : (
          <i className={clsx(icon, 'block', styles.icon)} />
        )}
      </div>

      <div className="mt-3 text-center">
        <h3>{title}</h3>
        <h5>{description}</h5>
      </div>
    </button>
  );
}
