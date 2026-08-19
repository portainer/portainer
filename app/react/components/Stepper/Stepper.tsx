import { Step, StepData } from './Step';

export type { StepData as Step };

interface Props {
  /** 0-based index of the current step */
  currentStepIndex: number;
  steps: Array<StepData>;
  /** Callback with 0-based step index */
  onStepClick?: (stepIndex: number) => void;
}

export function Stepper({ currentStepIndex, steps, onStepClick }: Props) {
  return (
    <nav
      aria-label="Progress steps"
      className="flex flex-wrap items-center gap-2"
    >
      {steps.map((step, index) => (
        <Step
          key={step.label}
          step={step}
          index={index}
          currentStepIndex={currentStepIndex}
          isLast={index === steps.length - 1}
          onStepClick={onStepClick}
        />
      ))}
    </nav>
  );
}
