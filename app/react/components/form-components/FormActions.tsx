import { PropsWithChildren } from 'react';

import { LoadingButton } from '@@/buttons';

interface Props {
  submitLabel: string;
  loadingText: string;
  isLoading: boolean;
  isValid: boolean;
  'data-cy'?: string;
}

export function FormActions({
  submitLabel = 'Save',
  loadingText = 'Saving',
  isLoading,
  children,
  isValid,
  'data-cy': dataCy,
}: PropsWithChildren<Props>) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <LoadingButton
          className="!ml-0"
          loadingText={loadingText}
          isLoading={isLoading}
          disabled={!isValid}
          data-cy={dataCy}
        >
          {submitLabel}
        </LoadingButton>

        {children}
      </div>
    </div>
  );
}
