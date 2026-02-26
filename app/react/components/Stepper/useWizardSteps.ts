import { useState, useCallback, useMemo } from 'react';

export interface StepConfig {
  id: string;
  label: string;
}

interface UseWizardStepsOptions {
  steps: Array<StepConfig>;
  initialStepId?: string;
}

interface WizardStepState {
  currentStep: StepConfig;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepId: string) => void;
  goToStepByIndex: (index: number) => void;
}

export function useWizardSteps({
  steps,
  initialStepId,
}: UseWizardStepsOptions): WizardStepState {
  const initialIndex = useMemo(() => {
    if (!initialStepId) return 0;
    const index = steps.findIndex((s) => s.id === initialStepId);
    return Math.max(0, index);
  }, [initialStepId, steps]);

  const [stepIndex, setStepIndex] = useState(initialIndex);

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const goToNextStep = useCallback(() => {
    setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i));
  }, [steps.length]);

  const goToPreviousStep = useCallback(() => {
    setStepIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goToStep = useCallback(
    (stepId: string) => {
      const index = steps.findIndex((s) => s.id === stepId);
      if (index !== -1) {
        setStepIndex(index);
      }
    },
    [steps]
  );

  const goToStepByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setStepIndex(index);
      }
    },
    [steps.length]
  );

  return {
    currentStep,
    currentStepIndex: stepIndex,
    isFirstStep,
    isLastStep,
    canGoBack: !isFirstStep,
    canGoForward: !isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    goToStepByIndex,
  };
}
