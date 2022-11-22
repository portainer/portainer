import { useState } from 'react';

import { UploadLicenseDialog } from './UploadLicenseDialog';
import { LoadingDialog } from './LoadingDialog';

type Step = 'uploadLicense' | 'loading' | 'getLicense';

export function UpgradeDialog({ onDismiss }: { onDismiss: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>('uploadLicense');

  const component = getDialog();

  return component;

  function getDialog() {
    switch (currentStep) {
      case 'getLicense':
        throw new Error('Not implemented');
      // return <GetLicense setCurrentStep={setCurrentStep} />;
      case 'uploadLicense':
        return (
          <UploadLicenseDialog
            goToLoading={() => setCurrentStep('loading')}
            onDismiss={onDismiss}
          />
        );
      case 'loading':
        return <LoadingDialog />;
      default:
        throw new Error('step type not found');
    }
  }
}
