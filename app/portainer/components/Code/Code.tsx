import clsx from 'clsx';

import { Button } from '../Button';
import { useCopy } from '../Button/CopyButton/useCopy';

import styles from './Code.module.css';

interface Props {
  showCopyButton?: boolean;
  children: string;
}

export function Code({ children, showCopyButton }: Props) {
  const { handleCopy, copiedSuccessfully } = useCopy(children);

  return (
    <div className={styles.root}>
      <code className={styles.code}>{children}</code>

      {showCopyButton && (
        <Button color="link" className={styles.copyButton} onClick={handleCopy}>
          <i
            className={clsx(
              'fa',
              copiedSuccessfully ? 'fa-check green-icon' : 'fa-copy '
            )}
            aria-hidden="true"
          />
        </Button>
      )}
    </div>
  );
}
