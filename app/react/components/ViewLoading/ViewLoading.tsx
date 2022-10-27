import clsx from 'clsx';
import { Settings } from 'react-feather';

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
          <Settings className="animate-spin-slow ml-1 !inline feather" />
        </span>
      )}
    </div>
  );
}
