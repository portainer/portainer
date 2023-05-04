import clsx from 'clsx';
import { Settings } from 'lucide-react';

import { Icon } from '@@/Icon';

import styles from './ViewLoading.module.css';

interface Props {
  message?: string;
}

export function ViewLoading({ message }: Props) {
  return (
    <div className={clsx('row', styles.root)}>
      <div className="sk-fold">
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
      </div>
      {message && (
        <span className={styles.message}>
          {message}
          <Icon icon={Settings} className="!ml-1 animate-spin-slow" />
        </span>
      )}
    </div>
  );
}
