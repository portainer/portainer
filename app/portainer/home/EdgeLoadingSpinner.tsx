import clsx from 'clsx';

import styles from './EdgeLoadingSpinner.module.css';

export function EdgeLoadingSpinner() {
  return (
    <div className={clsx('row', styles.root)}>
      Connecting to the Edge environment...
      <i className="fa fa-cog fa-spin space-left" />
    </div>
  );
}
