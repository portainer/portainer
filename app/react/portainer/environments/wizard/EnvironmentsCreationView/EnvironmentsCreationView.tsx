import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useState } from 'react';
import _ from 'lodash';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';

import { notifyError } from '@/portainer/services/notifications';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { useAnalytics } from '@/angulartics.matomo/analytics-services';

import { Stepper } from '@@/Stepper';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { Icon } from '@@/Icon';

import {
  EnvironmentOptionValue,
  environmentTypes,
  formTitles,
} from '../EnvironmentTypeSelectView/environment-types';

import { WizardDocker } from './WizardDocker';
import { WizardAzure } from './WizardAzure';
import { WizardKubernetes } from './WizardKubernetes';
import { AnalyticsState, AnalyticsStateKey } from './types';
import styles from './EnvironmentsCreationView.module.css';
import { WizardEndpointsList } from './WizardEndpointsList';

export function EnvironmentCreationView() {
  const {
    params: { localEndpointId: localEndpointIdParam },
  } = useCurrentStateAndParams();

  const [environmentIds, setEnvironmentIds] = useState<EnvironmentId[]>(() => {
    const localEndpointId = parseInt(localEndpointIdParam, 10);

    if (!localEndpointId || Number.isNaN(localEndpointId)) {
      return [];
    }

    return [localEndpointId];
  });

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

  const isDockerStandalone = currentStep.id === 'dockerStandalone';

  return (
    <>
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
      />

      <div className={styles.wizardWrapper}>
        <Widget>
          <WidgetTitle icon={Wand2} title="Environment Wizard" />
          <WidgetBody>
            <Stepper steps={steps} currentStep={currentStepIndex + 1} />

            <div className="mt-12">
              <FormSection title={formTitles[currentStep.id]}>
                <Component
                  onCreate={handleCreateEnvironment}
                  isDockerStandalone={isDockerStandalone}
                />

                <div
                  className={clsx(
                    styles.wizardStepAction,
                    'flex justify-between'
                  )}
                >
                  <Button disabled={isFirstStep} onClick={onPreviousClick}>
                    <Icon icon={ArrowLeft} /> Previous
                  </Button>
                  <Button onClick={onNextClick}>
                    {isLastStep ? 'Close' : 'Next'}
                    <Icon icon={ArrowRight} />
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
    if (localStorage.getItem('wizardReferrer') === 'environments') {
      localStorage.removeItem('wizardReferrer');
      router.stateService.go('portainer.endpoints');
      return;
    }
    router.stateService.go('portainer.home');
  }
}

function useParamEnvironmentTypes(): EnvironmentOptionValue[] {
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
  steps: (typeof environmentTypes)[number][],
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

  function getComponent(id: EnvironmentOptionValue) {
    switch (id) {
      case 'dockerStandalone':
      case 'dockerSwarm':
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
    kubernetesEdgeAgentAsync: 0,
    kubernetesEdgeAgentStandard: 0,
    kaasAgent: 0,
    aciApi: 0,
    localEndpoint: 0,
    nomadEdgeAgentStandard: 0,
    dockerEdgeAgentAsync: 0,
    dockerEdgeAgentStandard: 0,
  });

  return { analytics, setAnalytics };

  function setAnalytics(key: AnalyticsStateKey) {
    setAnalyticsState((prevState) => ({
      ...prevState,
      [key]: prevState[key] + 1,
    }));
  }
}
