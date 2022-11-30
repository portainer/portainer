import clsx from 'clsx';
import { Trash2 } from 'lucide-react';

import { Icon } from '@/react/components/Icon';

import styles from './TagButton.module.css';

interface Props {
  value: number;
  label: string;
  title: string;
  onRemove(): void;
}

export function TagButton({ value, label, title, onRemove }: Props) {
  // Fast fail when the label is composed of space
  if (!label.replace(/\s/g, '').length) {
    return null;
  }

  return (
    <button
      type="button"
      title={title}
      className={clsx(
        styles.removeTagBtn,
        'space-left',
        'tag',
        'vertical-center'
      )}
      onClick={() => onRemove()}
      key={value}
    >
      {label}
      <Icon icon={Trash2} />
    </button>
  );
}
