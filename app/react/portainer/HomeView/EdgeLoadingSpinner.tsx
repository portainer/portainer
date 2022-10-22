import clsx from 'clsx';

import { Icon } from '@@/Icon';

import styles from './EdgeLoadingSpinner.module.css';

export function EdgeLoadingSpinner() {
  return (
    <div className={clsx('row', styles.root)}>
      Connecting to the Edge environment...
      <Icon icon="settings" className="spin space-left" />
    </div>
  );
}
