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

  const { agentVersion } = agentDetailsQuery;

  const options = deployments.map((c) => {
    const code = c.command(agentVersion);

    return {
      id: c.id,
      label: c.label,
      children: <DeployCode code={code} />,
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
  code: string;
}

function DeployCode({ code }: DeployCodeProps) {
  return (
    <>
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
