import { useFormikContext } from 'formik';

import { StickyFooter } from '@@/StickyFooter/StickyFooter';
import { Button, LoadingButton } from '@@/buttons';

import { FormValues } from './type';
import { useWizardContext } from './WizardContext';

export function WizardFooter() {
  const { isFirstStep, isLastStep, goToPreviousStep } = useWizardContext();
  const { isSubmitting, isValid } = useFormikContext<FormValues>();

  return (
    <StickyFooter className="justify-end gap-4">
      <Button
        color="default"
        type="button"
        onClick={goToPreviousStep}
        disabled={isFirstStep}
        data-cy="gitops-source-wizard-back-button"
        size="medium"
      >
        Back
      </Button>
      <LoadingButton
        color="primary"
        type="submit"
        disabled={!isValid}
        data-cy="gitops-source-wizard-continue-button"
        size="medium"
        isLoading={isSubmitting}
        loadingText={isLastStep ? 'Creating...' : ''}
      >
        {isLastStep ? 'Create' : 'Continue'}
      </LoadingButton>
    </StickyFooter>
  );
}
