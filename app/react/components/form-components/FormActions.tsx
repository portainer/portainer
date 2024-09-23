import { ComponentProps, PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { LoadingButton } from '@@/buttons';

import { FormSection } from './FormSection';

interface Props extends AutomationTestingProps {
  submitLabel: string;
  loadingText: string;
  isLoading: boolean;
  isValid: boolean;
  errors?: unknown;
  submitIcon?: ComponentProps<typeof LoadingButton>['icon'];
}

export function FormActions({
  submitLabel = 'Save',
  loadingText = 'Saving',
  isLoading,
  children,
  isValid,
  errors,
  submitIcon,
  'data-cy': dataCy,
}: PropsWithChildren<Props>) {
  return (
    <FormSection title="Actions">
      <div className="form-group">
        <div className="col-sm-12">
          <div className="flex item-center gap-3">
            <LoadingButton
              className="!ml-0"
              loadingText={loadingText}
              isLoading={isLoading}
              disabled={!isValid}
              data-cy={dataCy}
              icon={submitIcon}
            >
              {submitLabel}
            </LoadingButton>

            {!isValid && (
              <div className="hidden" data-cy="errors">
                {JSON.stringify(errors)}
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
