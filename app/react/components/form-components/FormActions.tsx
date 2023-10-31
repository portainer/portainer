import { PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { LoadingButton } from '@@/buttons';

import { FormSection } from './FormSection';

interface Props extends AutomationTestingProps {
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
  'data-cy': dataCy,
}: PropsWithChildren<Props>) {
  return (
    <FormSection title="Actions">
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
    </FormSection>
  );
}
