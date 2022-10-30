import { useState } from 'react';

import {
  Environment,
  EnvironmentCreationTypes,
} from '@/react/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { FeatureId } from '@/portainer/feature-flags/enums';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BoxSelector } from '@@/BoxSelector';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';
import { useFilterEdgeOptionsIfNeeded } from '../useOnlyEdgeOptions';

import { AgentPanel } from './AgentPanel';
import { KubeConfigTeaserForm } from './KubeConfigTeaserForm';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

const defaultOptions: BoxSelectorOption<EnvironmentCreationTypes>[] = [
  {
    id: 'agent_endpoint',
    icon: 'svg-agent',
    label: 'Agent',
    value: EnvironmentCreationTypes.AgentEnvironment,
    description: '',
  },
  {
    id: 'edgeAgent',
    icon: 'svg-edgeagent',
    label: 'Edge Agent',
    description: '',
    value: EnvironmentCreationTypes.EdgeAgentEnvironment,
    hide: window.ddExtension,
  },
  {
    id: 'kubeconfig_endpoint',
    icon: 'svg-cloudimport',
    label: 'Import',
    value: EnvironmentCreationTypes.KubeConfigEnvironment,
    description: 'Import an existing Kubernetes config',
    feature: FeatureId.K8S_CREATE_FROM_KUBECONFIG,
  },
];

export function WizardKubernetes({ onCreate }: Props) {
  const options = useFilterEdgeOptionsIfNeeded(
    defaultOptions,
    EnvironmentCreationTypes.EdgeAgentEnvironment
  );

  const [creationType, setCreationType] = useState(options[0].value);

  const tab = getTab(creationType);

  return (
    <div className="form-horizontal">
      <BoxSelector
        onChange={(v) => setCreationType(v)}
        options={options}
        value={creationType}
        radioName="creation-type"
      />

      {tab}
    </div>
  );

  function getTab(type: typeof options[number]['value']) {
    switch (type) {
      case EnvironmentCreationTypes.AgentEnvironment:
        return (
          <AgentPanel
            onCreate={(environment) => onCreate(environment, 'kubernetesAgent')}
          />
        );
      case EnvironmentCreationTypes.EdgeAgentEnvironment:
        return (
          <EdgeAgentTab
            onCreate={(environment) =>
              onCreate(environment, 'kubernetesEdgeAgent')
            }
            commands={[{ ...commandsTabs.k8sLinux, label: 'Linux' }]}
          />
        );
      case EnvironmentCreationTypes.KubeConfigEnvironment:
        return (
          <div className="px-1 py-5 border border-solid border-orange-1">
            <BEFeatureIndicator
              featureId={options.find((o) => o.value === type)?.feature}
            />
            <KubeConfigTeaserForm />
          </div>
        );
      default:
        throw new Error('Creation type not supported');
    }
  }
}
