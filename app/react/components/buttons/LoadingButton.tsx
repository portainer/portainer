import { PropsWithChildren } from 'react';

import CircleNotch from '@/assets/ico/circle-notch.svg?c';

import { type Props as ButtonProps, Button } from './Button';

interface Props extends ButtonProps {
  loadingText: string;
  isLoading: boolean;
}

export function LoadingButton({
  loadingText,
  isLoading,
  disabled,
  type = 'submit',
  children,
  ...buttonProps
}: PropsWithChildren<Props>) {
  return (
    <Button
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...buttonProps}
      type={type}
      disabled={disabled || isLoading}
      icon={LoadingButtonIcon(isLoading)}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
}

function LoadingButtonIcon(isLoading: boolean) {
  if (isLoading) {
    return (
      <CircleNotch className="animate-spin-slow mr-1" aria-label="loading" />
    );
  }
  return null;
}
