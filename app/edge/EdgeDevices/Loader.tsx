import clsx from 'clsx';

import styles from './Loader.module.css';

interface Props {
  message: string;
}

export function Loader({ message }: Props) {
  return (
    <div className={clsx('row', styles.root)}>
      <div className="sk-fold">
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
        <div className="sk-fold-cube" />
      </div>
      <span className={styles.message}>
        {message}
        <i className="fa fa-cog fa-spin" />
      </span>
    </div>
  );
}
