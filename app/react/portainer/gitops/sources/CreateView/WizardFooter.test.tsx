import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import * as yup from 'yup';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { WizardStepState } from '@@/Stepper/useWizardSteps';

import { WizardStep, WizardProvider } from './WizardContext';
import { WizardFooter } from './WizardFooter';
import { FormValues } from './type';

function noop() {}

const firstStep: WizardStep = {
  id: 'step-1',
  label: 'First',
  component: () => null,
  validateStep: () => yup.object(),
};

const lastStep: WizardStep = {
  id: 'step-2',
  label: 'Last',
  component: () => null,
  validateStep: () => yup.object(),
};

function buildWizardContext(
  overrides: Partial<WizardStepState<WizardStep>> = {}
): WizardStepState<WizardStep> {
  return {
    currentStep: firstStep,
    currentStepIndex: 0,
    isFirstStep: true,
    isLastStep: false,
    canGoBack: false,
    canGoForward: true,
    goToNextStep: noop,
    goToPreviousStep: noop,
    goToStep: noop,
    goToStepByIndex: noop,
    ...overrides,
  };
}

const initialFormValues: FormValues = {
  name: '',
  type: 'git',
  git: {
    url: '',
    connectionOk: false,
    authentication: { authEnabled: false },
  },
  authorizedTeams: [],
  authorizedUsers: [],
  ownership: ResourceControlOwnership.ADMINISTRATORS,
};

const validFormValues: FormValues = {
  name: 'my-source',
  type: 'git',
  git: {
    url: 'https://github.com/org/repo.git',
    connectionOk: true,
    authentication: { authEnabled: false },
  },
  authorizedTeams: [],
  authorizedUsers: [],
  ownership: ResourceControlOwnership.ADMINISTRATORS,
};

function renderFooter({
  wizardContext = buildWizardContext(),
  formValues = initialFormValues,
  validationSchema,
  validateOnMount,
}: {
  wizardContext?: WizardStepState<WizardStep>;
  formValues?: FormValues;
  validationSchema?: Parameters<typeof Formik>[0]['validationSchema'];
  validateOnMount?: boolean;
} = {}) {
  return render(
    <Formik
      initialValues={formValues}
      onSubmit={noop}
      validationSchema={validationSchema}
      validateOnMount={validateOnMount}
    >
      <WizardProvider context={wizardContext}>
        <WizardFooter />
      </WizardProvider>
    </Formik>
  );
}

describe('WizardFooter', () => {
  it('disables Back on first step', () => {
    renderFooter({ wizardContext: buildWizardContext({ isFirstStep: true }) });

    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('enables Back when not on first step', () => {
    renderFooter({
      wizardContext: buildWizardContext({
        isFirstStep: false,
        canGoBack: true,
        currentStepIndex: 1,
      }),
    });

    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled();
  });

  it('shows Continue on non-last step', () => {
    renderFooter({ wizardContext: buildWizardContext({ isLastStep: false }) });

    expect(screen.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  it('shows Create on last step', () => {
    renderFooter({
      wizardContext: buildWizardContext({
        isFirstStep: false,
        isLastStep: true,
        currentStep: lastStep,
        currentStepIndex: 1,
        canGoBack: true,
        canGoForward: false,
      }),
      formValues: validFormValues,
    });

    expect(screen.getByRole('button', { name: /create/i })).toBeVisible();
  });

  it('disables Continue when form is invalid', async () => {
    renderFooter({
      wizardContext: buildWizardContext({ isLastStep: false }),
      formValues: initialFormValues,
      validationSchema: yup.object({ name: yup.string().required() }),
      validateOnMount: true,
    });

    expect(
      await screen.findByRole('button', { name: /continue/i })
    ).toBeDisabled();
  });

  it('enables Continue when form is valid', async () => {
    renderFooter({
      wizardContext: buildWizardContext({ isLastStep: false }),
      formValues: validFormValues,
      validationSchema: yup.object({ name: yup.string().required() }),
      validateOnMount: true,
    });

    expect(
      await screen.findByRole('button', { name: /continue/i })
    ).not.toBeDisabled();
  });

  it('calls goToPreviousStep when Back is clicked', async () => {
    const goToPreviousStep = vi.fn();
    const user = userEvent.setup();

    renderFooter({
      wizardContext: buildWizardContext({
        isFirstStep: false,
        canGoBack: true,
        goToPreviousStep,
      }),
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(goToPreviousStep).toHaveBeenCalledOnce();
  });
});
