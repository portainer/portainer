import { ComponentProps, ComponentType } from 'react';
import { Formik } from 'formik';

import { createContext } from '@/react/utils/context';

import { StepConfig, WizardStepState } from '@@/Stepper/useWizardSteps';

export type WizardStep = StepConfig & {
  component: ComponentType;
  validateStep: () => ComponentProps<typeof Formik>['validationSchema'];
};

const { Provider: WizardProvider, useContext: useWizardContext } =
  createContext<WizardStepState<WizardStep>>('WizardContext');

export { WizardProvider, useWizardContext };
