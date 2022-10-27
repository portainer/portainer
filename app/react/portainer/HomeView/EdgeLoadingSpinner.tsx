import clsx from 'clsx';
import { Settings } from 'react-feather';

import styles from './EdgeLoadingSpinner.module.css';

export function EdgeLoadingSpinner() {
  return (
    <div className={clsx('row', styles.root)}>
      Connecting to the Edge environment...
      <Settings className="animate-spin-slow space-left feather" />
    </div>
  );
}
