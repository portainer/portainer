import { Trash2 } from 'lucide-react';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { confirmDelete } from '@@/modals/confirm';

import { LoadingButton } from './LoadingButton';
import { Button } from './Button';

type ConfirmOrClick =
  | {
      confirmMessage: ReactNode;
      onConfirmed(): Promise<void> | void;
      onClick?: never;
    }
  | {
      confirmMessage?: never;
      onConfirmed?: never;
      /** if onClick is set, will skip confirmation (confirmation should be done on the parent) */
      onClick(): void;
    };

export function DeleteButton({
  disabled,
  size,
  children,
  isLoading,
  text = 'Remove',
  loadingText = 'Removing...',
  icon = false,
  type,
  'data-cy': dataCy,
  ...props
}: PropsWithChildren<
  AutomationTestingProps &
    ConfirmOrClick & {
      size?: ComponentProps<typeof Button>['size'];
      disabled?: boolean;
      isLoading?: boolean;
      text?: string;
      loadingText?: string;
      icon?: boolean;
      type?: ComponentProps<typeof Button>['type'];
    }
>) {
  if (isLoading === undefined) {
    return (
      <Button
        size={size}
        color="dangerlight"
        disabled={disabled || isLoading}
        onClick={() => handleClick()}
        icon={Trash2}
        className={clsx('!m-0', icon ? 'btn-icon' : '')}
        data-cy={dataCy}
        type={type}
      >
        {children || text}
      </Button>
    );
  }

  return (
    <LoadingButton
      size={size}
      color="dangerlight"
      disabled={disabled}
      onClick={() => handleClick()}
      icon={Trash2}
      className="!m-0"
      data-cy={dataCy}
      isLoading={isLoading}
      loadingText={loadingText}
      type={type}
    >
      {children || 'Remove'}
    </LoadingButton>
  );

  async function handleClick() {
    const { confirmMessage, onConfirmed, onClick } = props;
    if (onClick) {
      return onClick();
    }

    if (!(await confirmDelete(confirmMessage))) {
      return undefined;
    }

    return onConfirmed();
  }
}
