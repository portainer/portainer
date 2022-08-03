import clsx from 'clsx';

import { Icon } from '@/react/components/Icon';

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
        'vertical-center',
        'interactive',
        'vertical-center',
        styles.addButton
      )}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon icon="plus-circle" feather />
      {label}
    </button>
  );
}
