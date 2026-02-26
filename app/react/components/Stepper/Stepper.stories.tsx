import { Meta, StoryObj } from '@storybook/react';
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
  const steps: Array<Step> = Array.from({ length: totalSteps }).map(
    (_, index) => ({
      label: `Step ${index + 1}`,
    })
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <Stepper currentStepIndex={currentStepIndex} steps={steps} />
      <div className="flex gap-2">
        <Button
          onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
          data-cy="previous-button"
          disabled={currentStepIndex <= 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
          data-cy="next-button"
          disabled={currentStepIndex >= steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export { Template };

function ClickableTemplate({ totalSteps = 4 }: Args) {
  const steps: Array<Step> = [
    { label: 'Select Environment' },
    { label: 'Configure' },
    { label: 'Review' },
    { label: 'Deploy' },
  ].slice(0, totalSteps);

  const [currentStepIndex, setCurrentStepIndex] = useState(2);

  return (
    <div className="flex flex-col gap-4">
      <Stepper
        currentStepIndex={currentStepIndex}
        steps={steps}
        onStepClick={(stepIndex) => setCurrentStepIndex(stepIndex)}
      />
      <p className="text-sm text-gray-6">
        Click on completed or current steps to navigate. Current step:{' '}
        {currentStepIndex + 1}
      </p>
    </div>
  );
}

export const Clickable: StoryObj<Args> = {
  render: ClickableTemplate,
  args: {
    totalSteps: 4,
  },
};
