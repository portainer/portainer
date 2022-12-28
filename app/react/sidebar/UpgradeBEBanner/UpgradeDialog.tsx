import { useState } from 'react';

import { useUser } from '@/react/hooks/useUser';

import { UploadLicenseDialog } from './UploadLicenseDialog';
import { LoadingDialog } from './LoadingDialog';
import { NonAdminUpgradeDialog } from './NonAdminUpgradeDialog';
import { GetLicenseDialog } from './GetLicenseDialog';

type Step = 'uploadLicense' | 'loading' | 'getLicense';

export function UpgradeDialog({ onDismiss }: { onDismiss: () => void }) {
  const { isAdmin } = useUser();
  const [currentStep, setCurrentStep] = useState<Step>('uploadLicense');
  const [isGetLicenseSubmitted, setIsGetLicenseSubmitted] = useState(false);
  const component = getDialog();

  return component;

  function getDialog() {
    if (!isAdmin) {
      return <NonAdminUpgradeDialog onDismiss={onDismiss} />;
    }

    switch (currentStep) {
      case 'getLicense':
        return (
          <GetLicenseDialog
            goToUploadLicense={(isSubmitted) => {
              setCurrentStep('uploadLicense');
              setIsGetLicenseSubmitted(isSubmitted);
            }}
            onDismiss={onDismiss}
          />
        );
      case 'uploadLicense':
        return (
          <UploadLicenseDialog
            goToLoading={() => setCurrentStep('loading')}
            onDismiss={onDismiss}
            goToGetLicense={() => setCurrentStep('getLicense')}
            isGetLicenseSubmitted={isGetLicenseSubmitted}
          />
        );
      case 'loading':
        return <LoadingDialog />;
      default:
        throw new Error('step type not found');
    }
  }
}
