import { Check, Copy } from 'lucide-react';

import { Button } from '@@/buttons';
import { useCopy } from '@@/buttons/CopyButton/useCopy';
import { Icon } from '@@/Icon';

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
          <Icon
            icon={copiedSuccessfully ? Check : Copy}
            className="!ml-1"
            mode={copiedSuccessfully ? 'success' : undefined}
          />
        </Button>
      )}
    </div>
  );
}
