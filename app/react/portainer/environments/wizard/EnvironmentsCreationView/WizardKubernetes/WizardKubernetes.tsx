import { useState } from 'react';
import { Zap, UploadCloud } from 'lucide-react';
import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import EdgeAgentStandardIcon from '@/react/edge/components/edge-agent-standard.svg?c';
import EdgeAgentAsyncIcon from '@/react/edge/components/edge-agent-async.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BoxSelector } from '@@/BoxSelector';
import { BEOverlay } from '@@/BEFeatureIndicator/BEOverlay';

import { AnalyticsStateKey } from '../types';
import { EdgeAgentTab } from '../shared/EdgeAgentTab';

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

const options: BoxSelectorOption<CreationType>[] = _.compact([
  {
    id: 'agent_endpoint',
    icon: Zap,
    iconType: 'badge',
    label: 'Agent',
    value: 'agent',
    description: '',
  },
  {
    id: 'edgeAgentStandard',
    icon: EdgeAgentStandardIcon,
    iconType: 'badge',
    label: 'Edge Agent Standard',
    description: '',
    value: 'edgeAgentStandard',
  },
  isBE && {
    id: 'edgeAgentAsync',
    icon: EdgeAgentAsyncIcon,
    iconType: 'badge',
    label: 'Edge Agent Async',
    description: '',
    value: 'edgeAgentAsync',
  },
  {
    id: 'kubeconfig_endpoint',
    icon: UploadCloud,
    iconType: 'badge',
    label: 'Import',
    value: 'kubeconfig',
    description: 'Import an existing Kubernetes config',
    feature: FeatureId.K8S_CREATE_FROM_KUBECONFIG,
  },
]);

export function WizardKubernetes({ onCreate }: Props) {
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
              onCreate(environment, 'kubernetesEdgeAgentAsync')
            }
            commands={[{ ...commandsTabs.k8sLinux, label: 'Linux' }]}
          />
        );
      case 'kubeconfig':
        return (
          <div className="mb-3">
            <BEOverlay featureId={FeatureId.K8S_CREATE_FROM_KUBECONFIG}>
              <KubeConfigTeaserForm />
            </BEOverlay>
          </div>
        );
      default:
        throw new Error('Creation type not supported');
    }
  }
}
