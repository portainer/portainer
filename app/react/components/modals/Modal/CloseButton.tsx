import clsx from 'clsx';

import styles from './CloseButton.module.css';

export function CloseButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={clsx(styles.close, className)}
      onClick={() => onClose()}
    >
      ×
    </button>
  );
}
