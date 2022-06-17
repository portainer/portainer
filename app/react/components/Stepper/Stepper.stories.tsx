import { Meta } from '@storybook/react';
import { useState } from 'react';

import { Button } from '@@/buttons';

import { Step, Stepper } from './Stepper';

export default {
  component: Stepper,
  title: 'Components/Stepper',
} as Meta;

interface Args {
  totalSteps: number;
}

function Template({ totalSteps = 5 }: Args) {
  const steps: Step[] = Array.from({ length: totalSteps }).map((_, index) => ({
    title: `step ${index + 1}`,
  }));

  const [currentStep, setCurrentStep] = useState(1);

  return (
    <>
      <Stepper currentStep={currentStep} steps={steps} />
      <Button
        onClick={() => setCurrentStep(currentStep - 1)}
        disabled={currentStep <= 1}
      >
        Previous
      </Button>
      <Button
        onClick={() => setCurrentStep(currentStep + 1)}
        disabled={currentStep >= steps.length}
      >
        Next
      </Button>
    </>
  );
}

export { Template };
