import { useState } from 'react';
import { Zap, Cloud, UploadCloud } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BoxSelector } from '@@/BoxSelector';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';
import { BadgeIcon } from '@@/BadgeIcon';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';
import { useFilterEdgeOptionsIfNeeded } from '../useOnlyEdgeOptions';

import { AgentPanel } from './AgentPanel';
import { KubeConfigTeaserForm } from './KubeConfigTeaserForm';

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

type CreationType =
  | 'agent'
  | 'edgeAgentStandard'
  | 'edgeAgentAsync'
  | 'kubeconfig';

const defaultOptions: BoxSelectorOption<CreationType>[] = [
  {
    id: 'agent_endpoint',
    icon: <BadgeIcon icon={Zap} size="3xl" />,
    label: 'Agent',
    value: 'agent',
    description: '',
  },
  {
    id: 'edgeAgentStandard',
    icon: Cloud,
    iconType: 'badge',
    label: 'Edge Agent Standard',
    description: '',
    value: 'edgeAgentStandard',
  },
  {
    id: 'edgeAgentAsync',
    icon: Cloud,
    iconType: 'badge',
    label: 'Edge Agent Async',
    description: '',
    value: 'edgeAgentAsync',
  },
  {
    id: 'kubeconfig_endpoint',
    icon: <BadgeIcon icon={UploadCloud} size="3xl" />,
    label: 'Import',
    value: 'kubeconfig',
    description: 'Import an existing Kubernetes config',
    feature: FeatureId.K8S_CREATE_FROM_KUBECONFIG,
  },
];

export function WizardKubernetes({ onCreate }: Props) {
  const options = useFilterEdgeOptionsIfNeeded(defaultOptions, 'agent');

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

  function getTab(type: CreationType) {
    switch (type) {
      case 'agent':
        return (
          <AgentPanel
            onCreate={(environment) => onCreate(environment, 'kubernetesAgent')}
          />
        );
      case 'edgeAgentStandard':
        return (
          <EdgeAgentTab
            onCreate={(environment) =>
              onCreate(environment, 'kubernetesEdgeAgentStandard')
            }
            commands={[{ ...commandsTabs.k8sLinux, label: 'Linux' }]}
          />
        );
      case 'edgeAgentAsync':
        return (
          <EdgeAgentTab
            asyncMode
            onCreate={(environment) =>
              onCreate(environment, 'kubernetesEdgeAgentStandard')
            }
            commands={[{ ...commandsTabs.k8sLinux, label: 'Linux' }]}
          />
        );
      case 'kubeconfig':
        return (
          <div className="border border-solid border-orange-1 px-1 py-5">
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
