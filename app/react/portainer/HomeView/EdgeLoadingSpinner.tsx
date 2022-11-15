import clsx from 'clsx';
import { Settings } from 'react-feather';

import { Icon } from '@@/Icon';

import styles from './EdgeLoadingSpinner.module.css';

export function EdgeLoadingSpinner() {
  return (
    <div className={clsx('row', styles.root)}>
      Connecting to the Edge environment...
      <Icon icon={Settings} className="animate-spin-slow !ml-1" />
    </div>
  );
}
