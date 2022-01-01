import { PropsWithChildren } from 'react';

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
          <i
            className="fa fa-circle-notch fa-spin space-right"
            aria-label="loading"
            aria-hidden="true"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
