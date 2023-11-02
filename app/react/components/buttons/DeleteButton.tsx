import { Trash2 } from 'lucide-react';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { confirmDelete } from '@@/modals/confirm';

import { Button } from './Button';

export function DeleteButton({
  disabled,
  confirmMessage,
  onConfirmed,
  size,
  children,
}: PropsWithChildren<{
  size?: ComponentProps<typeof Button>['size'];
  disabled?: boolean;
  confirmMessage: ReactNode;
  onConfirmed(): Promise<void> | void;
}>) {
  return (
    <Button
      size={size}
      color="dangerlight"
      disabled={disabled}
      onClick={() => handleClick()}
      icon={Trash2}
      className="!m-0"
    >
      {children || 'Remove'}
    </Button>
  );

  async function handleClick() {
    if (!(await confirmDelete(confirmMessage))) {
      return undefined;
    }

    return onConfirmed();
  }
}
