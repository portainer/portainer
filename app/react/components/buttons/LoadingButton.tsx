import { PropsWithChildren, ReactNode } from 'react';

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
  icon,
  ...buttonProps
}: PropsWithChildren<Props>) {
  return (
    <Button
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...buttonProps}
      type={type}
      disabled={disabled || isLoading}
      icon={loadingButtonIcon(isLoading, icon)}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
}

function loadingButtonIcon(isLoading: boolean, defaultIcon: ReactNode) {
  if (!isLoading) {
    return defaultIcon;
  }
  return (
    <Icon
      icon={CircleNotch}
      className="animate-spin-slow ml-1"
      aria-label="loading"
    />
  );
}
