import clsx from 'clsx';

import { Icon } from '@/react/components/Icon';

import styles from './AddButton.module.css';

export interface Props {
  className?: string;
  label: string;
  onClick: () => void;
}

export function AddButton({ label, onClick, className }: Props) {
  return (
    <button
      className={clsx(
        className,
        'label',
        'label-default',
        'interactive',
        'vertical-center',
        styles.addButton
      )}
      type="button"
      onClick={onClick}
    >
      <Icon icon="plus-circle" feather />
      {label}
    </button>
  );
}
