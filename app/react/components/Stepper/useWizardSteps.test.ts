import { renderHook, act } from '@testing-library/react-hooks';

import { useWizardSteps, StepConfig } from './useWizardSteps';

const testSteps: Array<StepConfig> = [
  { id: 'step-1', label: 'First Step' },
  { id: 'step-2', label: 'Second Step' },
  { id: 'step-3', label: 'Third Step' },
];

describe('useWizardSteps', () => {
  describe('initial state', () => {
    it('should start at the first step by default', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      expect(result.current.currentStep).toEqual(testSteps[0]);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.canGoBack).toBe(false);
      expect(result.current.canGoForward).toBe(true);
    });

    it('should start at the specified initial step', () => {
      const { result } = renderHook(() =>
        useWizardSteps({ steps: testSteps, initialStepId: 'step-2' })
      );

      expect(result.current.currentStep).toEqual(testSteps[1]);
      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(false);
    });

    it('should default to first step if initialStepId is invalid', () => {
      const { result } = renderHook(() =>
        useWizardSteps({ steps: testSteps, initialStepId: 'invalid-id' })
      );

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toEqual(testSteps[0]);
    });
  });

  describe('goToNextStep', () => {
    it('should advance to the next step', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.currentStep).toEqual(testSteps[1]);
    });

    it('should not advance past the last step', () => {
      const { result } = renderHook(() =>
        useWizardSteps({ steps: testSteps, initialStepId: 'step-3' })
      );
      expect(result.current.isLastStep).toBe(true);

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('goToPreviousStep', () => {
    it('should go back to the previous step', () => {
      const { result } = renderHook(() =>
        useWizardSteps({ steps: testSteps, initialStepId: 'step-2' })
      );

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep).toEqual(testSteps[0]);
    });

    it('should not go back before the first step', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });
  });

  describe('goToStep', () => {
    it('should navigate to a step by id', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToStep('step-3');
      });

      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.currentStep).toEqual(testSteps[2]);
    });

    it('should not change step if id is invalid', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToStep('invalid-id');
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('goToStepByIndex', () => {
    it('should navigate to a step by index', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToStepByIndex(2);
      });

      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.currentStep).toEqual(testSteps[2]);
    });

    it('should not change step if index is out of bounds', () => {
      const { result } = renderHook(() => useWizardSteps({ steps: testSteps }));

      act(() => {
        result.current.goToStepByIndex(10);
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.goToStepByIndex(-1);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });
});
