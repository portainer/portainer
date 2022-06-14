import clsx from 'clsx';

import styles from './KaaSIcon.module.css';

export interface Props {
  selected?: boolean;
  className?: string;
}

export function KaaSIcon({ selected, className }: Props) {
  return (
    <span
      className={clsx('fa-stack fa-1x', styles.root, className, {
        [styles.selected]: selected,
      })}
    >
      <i className="fas fa-cloud fa-stack-2x" />
      <i className={clsx('fas fa-dharmachakra fa-stack-1x', styles.maskIcon)} />
    </span>
  );
}
