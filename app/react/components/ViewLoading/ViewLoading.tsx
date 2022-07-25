import clsx from 'clsx';

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
          <i className="fa fa-cog fa-spin space-left" />
        </span>
      )}
    </div>
  );
}
