import { useState } from 'react';

import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';
import { useAgentDetails } from '@/portainer/environments/queries/useAgentDetails';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { NavTabs } from '@@/NavTabs';

const deployments = [
  {
    id: 'linux',
    label: 'Linux',
    command: linuxCommand,
  },
  {
    id: 'win',
    label: 'Windows',
    command: winCommand,
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
      children: <DeployCode agentSecret={agentSecret} code={code} />,
    };
  });

  return (
    <NavTabs
      options={options}
      onSelect={(id: string) => setDeployType(id)}
      selectedId={deployType}
    />
  );
}

interface DeployCodeProps {
  agentSecret?: string;
  code: string;
}

function DeployCode({ agentSecret, code }: DeployCodeProps) {
  return (
    <>
      {agentSecret && (
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
      <span className="text-muted small">
        CLI script for installing agent on your environment with Docker Swarm:
      </span>
      <Code>{code}</Code>
      <CopyButton copyText={code}>Copy command</CopyButton>
    </>
  );
}

function linuxCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `curl -L https://downloads.portainer.io/ee${agentShortVersion}/agent-stack.yml -o agent-stack.yml && docker stack deploy --compose-file=agent-stack.yml portainer-agent`;
}

function winCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `curl -L https://downloads.portainer.io/ee${agentShortVersion}/agent-stack-windows.yml -o agent-stack-windows.yml && docker stack deploy --compose-file=agent-stack-windows.yml portainer-agent `;
}
