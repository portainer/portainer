import clsx from 'clsx';

import styles from './AddButton.module.css';

export interface Props {
  className?: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function AddButton({ label, onClick, className, disabled }: Props) {
  return (
    <button
      className={clsx(
        className,
        'label',
        'label-default',
        'interactive',
        styles.addButton
      )}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <i className="fa fa-plus-circle space-right" aria-hidden="true" /> {label}
    </button>
  );
}
