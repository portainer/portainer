import { Stepper } from '@@/Stepper/Stepper';

import { WizardStep, useWizardContext } from './WizardContext';

type Props = {
  steps: WizardStep[];
};

export function WizardHeader({ steps }: Props) {
  const { currentStepIndex, goToStepByIndex } = useWizardContext();

  return (
    <div className="row">
      <div className="col-sm-12 px-0">
        <Stepper
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={goToStepByIndex}
        />
      </div>
    </div>
  );
}
