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
      className={clsx(
        styles.close,
        className,
        'close-button absolute right-5 top-4'
      )}
      onClick={() => onClose()}
    >
      ×
    </button>
  );
}
