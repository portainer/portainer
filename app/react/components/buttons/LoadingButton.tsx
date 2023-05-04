import { PropsWithChildren, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

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
      icon={Loader2}
      className="ml-1 animate-spin-slow"
      aria-label="loading"
    />
  );
}
