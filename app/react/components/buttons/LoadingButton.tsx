import { PropsWithChildren } from 'react';

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
    >
      {isLoading ? (
        <>
          <Icon
            icon="svg-circlenotch"
            className="animate-spin-slow ml-1"
            ariaLabel="loading"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
