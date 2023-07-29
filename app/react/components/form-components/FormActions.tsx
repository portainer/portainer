import { PropsWithChildren } from 'react';

import { LoadingButton } from '@@/buttons';

interface Props {
  submitLabel: string;
  loadingText: string;
  isLoading: boolean;
  isValid: boolean;
}

export function FormActions({
  submitLabel = 'Save',
  loadingText = 'Saving',
  isLoading,
  children,
  isValid,
}: PropsWithChildren<Props>) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <LoadingButton
          className="!ml-0"
          loadingText={loadingText}
          isLoading={isLoading}
          disabled={!isValid}
        >
          {submitLabel}
        </LoadingButton>

        {children}
      </div>
    </div>
  );
}
