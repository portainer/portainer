import { useWizardSteps } from '@@/Stepper/useWizardSteps';
import { PageHeader } from '@@/PageHeader';

import { ConfigureStep, validateConfigureStep } from './steps/ConfigureStep';
import { WizardStep, WizardProvider } from './WizardContext';
import { CreateForm } from './CreateForm';
import {
  AccessControlStep,
  validateAccessControlStep,
} from './steps/AccessControlStep';

const steps: WizardStep[] = [
  {
    id: 'configure',
    label: 'Configure connection',
    component: ConfigureStep,
    validateStep: validateConfigureStep,
  },
  {
    id: 'access',
    label: 'Access control',
    component: AccessControlStep,
    validateStep: validateAccessControlStep,
  },
];

export function CreateView() {
  const context = useWizardSteps<WizardStep>({ steps });

  return (
    <div className="form-horizontal pb-20">
      <PageHeader
        title="Create Source"
        breadcrumbs={[
          { link: '.^', label: 'GitOps Sources' },
          { label: 'Create Source' },
        ]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <WizardProvider context={context}>
            <CreateForm steps={steps} />
          </WizardProvider>
        </div>
      </div>
    </div>
  );
}
