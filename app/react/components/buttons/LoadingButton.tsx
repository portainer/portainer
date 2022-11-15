import { PropsWithChildren } from 'react';

import CircleNotch from '@/assets/ico/circle-notch.svg?c';

import { Icon } from '@@/Icon';

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
      <Icon
        icon={CircleNotch}
        className="animate-spin-slow ml-1"
        aria-label="loading"
      />
    );
  }
  return null;
}
