import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useState } from 'react';
import _ from 'lodash';
import clsx from 'clsx';

import { Stepper } from '@/react/components/Stepper';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { notifyError } from '@/portainer/services/notifications';
import { PageHeader } from '@/portainer/components/PageHeader';
import { Button } from '@/portainer/components/Button';
import { Environment, EnvironmentId } from '@/portainer/environments/types';
import { useAnalytics } from '@/angulartics.matomo/analytics-services';
import { r2a } from '@/react-tools/react2angular';
import { FormSection } from '@/portainer/components/form-components/FormSection';

import { environmentTypes } from '../EnvironmentTypeSelectView/environment-types';
import { EnvironmentSelectorValue } from '../EnvironmentTypeSelectView/EnvironmentSelector';

import { WizardDocker } from './WizardDocker';
import { WizardAzure } from './WizardAzure';
import { WizardKubernetes } from './WizardKubernetes';
import { AnalyticsState, AnalyticsStateKey } from './types';
import styles from './EnvironmentsCreationView.module.css';
import { WizardEndpointsList } from './WizardEndpointsList';

export function EnvironmentCreationView() {
  const {
    params: { localEndpointId },
  } = useCurrentStateAndParams();

  const [environmentIds, setEnvironmentIds] = useState<EnvironmentId[]>([
    parseInt(localEndpointId, 10),
  ]);
  const envTypes = useParamEnvironmentTypes();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const steps = _.compact(
    envTypes.map((id) => environmentTypes.find((eType) => eType.id === id))
  );
  const { analytics, setAnalytics } = useAnalyticsState();

  const {
    currentStep,
    onNextClick,
    onPreviousClick,
    currentStepIndex,
    Component,
    isFirstStep,
    isLastStep,
  } = useStepper(steps, handleFinish);

  return (
    <>
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
      />

      <div className={styles.wizardWrapper}>
        <Widget>
          <WidgetTitle icon="fa-magic" title="Environment Wizard" />
          <WidgetBody>
            <Stepper steps={steps} currentStep={currentStepIndex + 1} />

            <div className="mt-24">
              <FormSection
                title={`Connect to your ${currentStep.title}
                    environment`}
              >
                <Component onCreate={handleCreateEnvironment} />

                <div
                  className={clsx(
                    styles.wizardStepAction,
                    'flex justify-between'
                  )}
                >
                  <Button disabled={isFirstStep} onClick={onPreviousClick}>
                    <i className="fas fa-arrow-left space-right" /> Previous
                  </Button>
                  <Button onClick={onNextClick}>
                    {isLastStep ? 'Finish' : 'Next'}
                    <i className="fas fa-arrow-right space-left" />
                  </Button>
                </div>
              </FormSection>
            </div>
          </WidgetBody>
        </Widget>
        <div>
          <WizardEndpointsList environmentIds={environmentIds} />
        </div>
      </div>
    </>
  );

  function handleCreateEnvironment(
    environment: Environment,
    analytics: AnalyticsStateKey
  ) {
    setEnvironmentIds((prev) => [...prev, environment.Id]);
    setAnalytics(analytics);
  }

  function handleFinish() {
    trackEvent('endpoint-wizard-environment-add-finish', {
      category: 'portainer',
      metadata: Object.fromEntries(
        Object.entries(analytics).map(([key, value]) => [
          _.kebabCase(key),
          value,
        ])
      ),
    });
    router.stateService.go('portainer.home');
  }
}

function useParamEnvironmentTypes(): EnvironmentSelectorValue[] {
  const {
    params: { envType },
  } = useCurrentStateAndParams();
  const router = useRouter();

  if (!envType) {
    notifyError('No environment type provided');
    router.stateService.go('portainer.wizard.endpoints');
    return [];
  }

  return Array.isArray(envType) ? envType : [envType];
}

function useStepper(
  steps: typeof environmentTypes[number][],
  onFinish: () => void
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps[currentStepIndex];

  return {
    currentStep,
    onNextClick,
    onPreviousClick,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    Component: getComponent(currentStep.id),
  };

  function onNextClick() {
    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    onFinish();
  }

  function onPreviousClick() {
    setCurrentStepIndex(currentStepIndex - 1);
  }

  function getComponent(id: EnvironmentSelectorValue) {
    switch (id) {
      case 'docker':
        return WizardDocker;
      case 'aci':
        return WizardAzure;
      case 'kubernetes':
        return WizardKubernetes;
      default:
        throw new Error(`Unknown environment type ${id}`);
    }
  }
}

function useAnalyticsState() {
  const [analytics, setAnalyticsState] = useState<AnalyticsState>({
    dockerAgent: 0,
    dockerApi: 0,
    kubernetesAgent: 0,
    kubernetesEdgeAgent: 0,
    kaasAgent: 0,
    aciApi: 0,
    localEndpoint: 0,
    nomadEdgeAgent: 0,
  });

  return { analytics, setAnalytics };

  function setAnalytics(key: AnalyticsStateKey) {
    setAnalyticsState((prevState) => ({
      ...prevState,
      [key]: prevState[key] + 1,
    }));
  }
}

export const EnvironmentCreationViewAngular = r2a(EnvironmentCreationView, []);
