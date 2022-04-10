import { useEffect } from 'react';

import { Code } from '@/portainer/components/Code';
import { NavTabs } from '@/portainer/components/NavTabs/NavTabs';
import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';

import { EdgeProperties, Platform } from './types';

const commandsByOs = {
  linux: [
    {
      id: 'standalone',
      label: 'Docker Standalone',
      command: buildLinuxStandaloneCommand,
    },
    {
      id: 'swarm',
      label: 'Docker Swarm',
      command: buildLinuxSwarmCommand,
    },
    {
      id: 'k8s',
      label: 'Kubernetes',
      command: buildKubernetesCommand,
    },
  ],
  win: [
    {
      id: 'standalone',
      label: 'Docker Standalone',
      command: buildWindowsStandaloneCommand,
    },
    {
      id: 'swarm',
      label: 'Docker Swarm',
      command: buildWindowsSwarmCommand,
    },
  ],
};

interface Props {
  values: EdgeProperties;
  edgeKey: string;
  agentVersion: string;
  onPlatformChange(platform: Platform): void;
}

export function Scripts({
  agentVersion,
  values,
  edgeKey,
  onPlatformChange,
}: Props) {
  const {
    os,
    allowSelfSignedCertificates,
    edgeIdGenerator,
    envVars,
    platform,
  } = values;

  useEffect(() => {
    if (!commandsByOs[os].find((p) => p.id === platform)) {
      onPlatformChange('standalone');
    }
  }, [os, platform, onPlatformChange]);

  const options = commandsByOs[os].map((c) => ({
    id: c.id,
    label: c.label,
    children: (
      <Code showCopyButton>
        {c.command(
          agentVersion,
          edgeIdGenerator,
          edgeKey,
          allowSelfSignedCertificates,
          envVars
        )}
      </Code>
    ),
  }));

  return (
    <div className="row">
      <div className="col-sm-12">
        <NavTabs
          selectedId={platform}
          options={options}
          onSelect={(id: Platform) => onPlatformChange(id)}
        />
      </div>
    </div>
  );
}

function buildEnvironmentSubCommand(envVars: string) {
  if (!envVars) {
    return '';
  }

  const args = envVars
    .split(',')
    .filter((s) => s.length > 0)
    .map((s) => `-e ${s}`);

  return args.length === 0 ? '' : `\n  ${args.join(' \\\n  ')} \\`;
}

function buildLinuxStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);
  return `${edgeIdScript ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n` : ''}
docker run -d \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -v /var/lib/docker/volumes:/var/lib/docker/volumes \\
  -v /:/host \\
  -v portainer_agent_data:/data \\
  --restart always \\
  -e EDGE=1 \\
  -e EDGE_ID=$PORTAINER_EDGE_ID \\
  -e EDGE_KEY=${edgeKey} \\
  -e CAP_HOST_MANAGEMENT=1 \\
  -e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\ ${env}
  --name portainer_edge_agent \\
  portainer/agent:${agentVersion}
  `;
}

function buildWindowsStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return `${
    edgeIdScript ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdScript})" \n\n` : ''
  }
docker run -d \\
  --mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\
  --mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\
  --mount type=volume,src=portainer_agent_data,dst=C:\\data \\
  --restart always \\
  -e EDGE=1 \\
  -e EDGE_ID=$Env:PORTAINER_EDGE_ID \\
  -e EDGE_KEY=${edgeKey} \\
  -e CAP_HOST_MANAGEMENT=1 \\
  -e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\ ${env}
  --name portainer_edge_agent \\
  portainer/agent:${agentVersion}
  `;
}

function buildLinuxSwarmCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return `${edgeIdScript ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n` : ''}
docker network create \\
  --driver overlay \\
  portainer_agent_network;
  
docker service create \\
  --name portainer_edge_agent \\
  --network portainer_agent_network \\
  -e AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent \\
  -e EDGE=1 \\
  -e EDGE_ID=$PORTAINER_EDGE_ID \\
  -e EDGE_KEY=${edgeKey} \\
  -e CAP_HOST_MANAGEMENT=1 \\
  -e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0}  \\ ${env}
  --mode global \\
  --constraint 'node.platform.os == linux' \\
  --mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \\
  --mount type=bind,src=//var/lib/docker/volumes,dst=/var/lib/docker/volumes \\
  --mount type=bind,src=//,dst=/host \\
  --mount type=volume,src=portainer_agent_data,dst=/data \\
  portainer/agent:${agentVersion}
`;
}

function buildWindowsSwarmCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return `${
    edgeIdScript ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdScript})" \n\n` : ''
  }
docker network create \\
  --driver overlay \\
  portainer_agent_network;

docker service create \\
  --name portainer_edge_agent \\
  --network portainer_agent_network \\
  -e AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent \\
  -e EDGE=1 \\
  -e EDGE_ID=$Env:PORTAINER_EDGE_ID \\
  -e EDGE_KEY=${edgeKey} \\
  -e CAP_HOST_MANAGEMENT=1 \\
  -e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\ ${env}
  --mode global \\
  --constraint 'node.platform.os == windows' \\
  --mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\
  --mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\
  --mount type=volume,src=portainer_agent_data,dst=C:\\data \\
  portainer/agent:${agentVersion}
`;
}

function buildKubernetesCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean
) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `${edgeIdScript ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n` : ''}

curl https://downloads.portainer.io/portainer-ee${agentShortVersion}-edge-agent-setup.sh | 
  bash -s -- $EDGE_ID ${edgeKey} ${allowSelfSignedCerts ? '1' : '0'}`;
}
