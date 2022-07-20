import { useState } from 'react';

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
    const code = c.command(agentVersion, agentSecret);

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

function linuxCommand(agentVersion: string, agentSecret: string) {
  const secret =
    agentSecret === '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;

  return `docker network create \\
--driver overlay \\
  portainer_agent_network

docker service create \\
  --name portainer_agent \\
  --network portainer_agent_network \\
  -p 9001:9001/tcp ${secret}\\
  --mode global \\
  --constraint 'node.platform.os == linux' \\
  --mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \\
  --mount type=bind,src=//var/lib/docker/volumes,dst=/var/lib/docker/volumes \\
  portainer/agent:${agentVersion}
`;
}

function winCommand(agentVersion: string, agentSecret: string) {
  const secret =
    agentSecret === '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;

  return `docker network create \\
--driver overlay \\
  portainer_agent_network && \\
docker service create \\
  --name portainer_agent \\
  --network portainer_agent_network \\
  -p 9001:9001/tcp ${secret}\\
  --mode global \\
  --constraint 'node.platform.os == windows' \\
  --mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\
  --mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\
  portainer/agent:${agentVersion}
`;
}
