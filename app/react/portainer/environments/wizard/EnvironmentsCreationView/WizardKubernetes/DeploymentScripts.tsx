import { useState } from 'react';

import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';
import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { NavTabs } from '@@/NavTabs';

const deployments = [
  {
    id: 'k8sLoadBalancer',
    label: 'Kubernetes via load balancer',
    command: kubeLoadBalancerCommand,
    showAgentSecretMessage: true,
  },
  {
    id: 'k8sNodePort',
    label: 'Kubernetes via node port',
    command: kubeNodePortCommand,
    showAgentSecretMessage: true,
  },
];

export function DeploymentScripts() {
  const [deployType, setDeployType] = useState(deployments[0].id);

  const agentDetailsQuery = useAgentDetails();

  if (!agentDetailsQuery) {
    return null;
  }

  const { agentVersion, agentSecret } = agentDetailsQuery;

  const options = deployments.map((c) => {
    const code = c.command(agentVersion);

    return {
      id: c.id,
      label: c.label,
      children: (
        <DeployCode
          agentSecret={agentSecret}
          showAgentSecretMessage={c.showAgentSecretMessage}
          code={code}
        />
      ),
    };
  });

  return (
    <>
      <FormSectionTitle>Information</FormSectionTitle>

      <div className="form-group">
        <span className="col-sm-12 text-muted small">
          Ensure that you have deployed the Portainer agent in your cluster
          first. Refer to the platform related command below to deploy it.
        </span>
      </div>

      <NavTabs
        options={options}
        onSelect={(id: string) => setDeployType(id)}
        selectedId={deployType}
      />
    </>
  );
}

function kubeNodePortCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `kubectl apply -f https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-nodeport.yaml`;
}

function kubeLoadBalancerCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `kubectl apply -f https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-lb.yaml`;
}

interface LoadBalancerProps {
  agentSecret?: string;
  showAgentSecretMessage?: boolean;
  code: string;
}

function DeployCode({
  agentSecret,
  showAgentSecretMessage,
  code,
}: LoadBalancerProps) {
  return (
    <>
      {showAgentSecretMessage && agentSecret && (
        <p className="text-muted small my-6">
          <i
            className="fa fa-info-circle blue-icon space-right"
            aria-hidden="true"
          />
          Note that the environment variable AGENT_SECRET will need to be set to
          <code>{agentSecret}</code>. Please update the manifest that will be
          downloaded from the following script.
        </p>
      )}
      <Code>{code}</Code>
      <CopyButton copyText={code}>Copy command</CopyButton>
    </>
  );
}
