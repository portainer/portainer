import { useState } from 'react';

import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { NavTabs } from '@@/NavTabs';

const deploymentsStandalone = [
  {
    id: 'linux',
    label: 'Linux & Windows WSL',
    command: linuxStandaloneCommand,
  },
  {
    id: 'win',
    label: 'Windows WCS',
    command: winStandaloneCommand,
  },
];

const deploymentsSwarm = [
  {
    id: 'linux',
    label: 'Linux & Windows WSL',
    command: linuxSwarmCommand,
  },
  {
    id: 'win',
    label: 'Windows WCS',
    command: winSwarmCommand,
  },
];

interface Props {
  isDockerStandalone?: boolean;
}

export function DeploymentScripts({ isDockerStandalone }: Props) {
  const deployments = isDockerStandalone
    ? deploymentsStandalone
    : deploymentsSwarm;
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
      <div className="code-script">
        <Code>{code}</Code>
      </div>
      <CopyButton copyText={code}>Copy command</CopyButton>
    </>
  );
}

function linuxStandaloneCommand(agentVersion: string, agentSecret: string) {
  const secret =
    agentSecret === '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;

  return `docker run -d \\
  -p 9001:9001 ${secret}\\
  --name portainer_agent \\
  --restart=always \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -v /var/lib/docker/volumes:/var/lib/docker/volumes \\
  portainer/agent:${agentVersion}
`;
}

function linuxSwarmCommand(agentVersion: string, agentSecret: string) {
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

function winStandaloneCommand(agentVersion: string, agentSecret: string) {
  const secret =
    agentSecret === '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;

  return `docker run -d \\
  -p 9001:9001 ${secret}\\
  --name portainer_agent \\
  --restart=always \\
  -v C:\\:C:\\host \\
  -v C:\\ProgramData\\docker\\volumes:C:\\ProgramData\\docker\\volumes \\
  -v \\\\.\\pipe\\docker_engine:\\\\.\\pipe\\docker_engine \\
  portainer/agent:${agentVersion}
`;
}

function winSwarmCommand(agentVersion: string, agentSecret: string) {
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
