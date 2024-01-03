import { PropsWithChildren, ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import { LoadingButton } from '@@/buttons';

import { FormSection } from './FormSection';

interface Props extends AutomationTestingProps {
  submitLabel: string;
  loadingText: string;
  isLoading: boolean;
  isValid: boolean;
  submitButtonIcon?: ReactNode;
}

export function FormActions({
  submitLabel = 'Save',
  loadingText = 'Saving',
  isLoading,
  children,
  isValid,
  submitButtonIcon,
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
            icon={submitButtonIcon}
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
