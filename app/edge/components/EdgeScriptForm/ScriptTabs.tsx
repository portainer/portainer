import { useEffect } from 'react';
import _ from 'lodash';

import { Code } from '@/portainer/components/Code';
import { CopyButton } from '@/portainer/components/Button/CopyButton';
import { NavTabs } from '@/portainer/components/NavTabs/NavTabs';
import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';

import { EdgeProperties, Platform } from './types';

const commandsByOs = {
  linux: [
    {
      id: 'k8s',
      label: 'Kubernetes',
      command: buildKubernetesCommand,
    },
    {
      id: 'swarm',
      label: 'Docker Swarm',
      command: buildLinuxSwarmCommand,
    },
    {
      id: 'standalone',
      label: 'Docker Standalone',
      command: buildLinuxStandaloneCommand,
    },
  ],
  win: [
    {
      id: 'swarm',
      label: 'Docker Swarm',
      command: buildWindowsSwarmCommand,
    },
    {
      id: 'standalone',
      label: 'Docker Standalone',
      command: buildWindowsStandaloneCommand,
    },
  ],
};

interface Props {
  values: EdgeProperties;
  edgeKey: string;
  agentVersion: string;
  edgeId?: string;
  agentSecret?: string;
  onPlatformChange(platform: Platform): void;
}

export function ScriptTabs({
  agentVersion,
  values,
  edgeKey,
  edgeId,
  agentSecret,
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
      onPlatformChange('swarm');
    }
  }, [os, platform, onPlatformChange]);

  const options = commandsByOs[os].map((c) => {
    const cmd = c.command(
      agentVersion,
      edgeIdGenerator,
      edgeKey,
      allowSelfSignedCertificates,
      envVars,
      edgeId,
      agentSecret
    );

    return {
      id: c.id,
      label: c.label,
      children: (
        <>
          <Code>{cmd}</Code>
          <CopyButton copyText={cmd}>Copy</CopyButton>
        </>
      ),
    };
  });

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

function buildDockerEnvVars(envVars: string, defaultVars: string[]) {
  const vars = defaultVars.concat(
    envVars.split(',').filter((s) => s.length > 0)
  );

  return vars.map((s) => `-e ${s}`).join(' \\\n  ');
}

function buildLinuxStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string,
  edgeId?: string,
  agentSecret?: string
) {
  const env = buildDockerEnvVars(
    envVars,
    buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCerts,
      !edgeIdScript ? edgeId : undefined,
      agentSecret
    )
  );

  return `${edgeIdScript ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n` : ''}\
docker run -d \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -v /var/lib/docker/volumes:/var/lib/docker/volumes \\
  -v /:/host \\
  -v portainer_agent_data:/data \\
  --restart always \\
  ${env} \\
  --name portainer_edge_agent \\
  portainer/agent:${agentVersion}
  `;
}

function buildWindowsStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string,
  edgeId?: string,
  agentSecret?: string
) {
  const env = buildDockerEnvVars(
    envVars,
    buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCerts,
      edgeIdScript ? '$Env:PORTAINER_EDGE_ID' : edgeId,
      agentSecret
    )
  );

  return `${
    edgeIdScript ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdScript})" \n\n` : ''
  }\
docker run -d \\
  --mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\
  --mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\
  --mount type=volume,src=portainer_agent_data,dst=C:\\data \\
  --restart always \\
   ${env} \\
  --name portainer_edge_agent \\
  portainer/agent:${agentVersion}
  `;
}

function buildLinuxSwarmCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string,
  edgeId?: string,
  agentSecret?: string
) {
  const env = buildDockerEnvVars(envVars, [
    ...buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCerts,
      !edgeIdScript ? edgeId : undefined,
      agentSecret
    ),
    'AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent',
  ]);

  return `${edgeIdScript ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n` : ''}\
docker network create \\
  --driver overlay \\
  portainer_agent_network;
  
docker service create \\
  --name portainer_edge_agent \\
  --network portainer_agent_network \\
  ${env} \\
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
  envVars: string,
  edgeId?: string,
  agentSecret?: string
) {
  const env = buildDockerEnvVars(envVars, [
    ...buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCerts,
      edgeIdScript ? '$Env:PORTAINER_EDGE_ID' : edgeId,
      agentSecret
    ),
    'AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent',
  ]);

  return `${
    edgeIdScript ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdScript})" \n\n` : ''
  }
docker network create \\
  --driver overlay \\
  portainer_agent_network;

docker service create \\
  --name portainer_edge_agent \\
  --network portainer_agent_network \\
  ${env} \\
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
  allowSelfSignedCerts: boolean,
  envVars: string,
  edgeId?: string,
  agentSecret = ''
) {
  const agentShortVersion = getAgentShortVersion(agentVersion);
  const idEnvVar = edgeIdScript
    ? `PORTAINER_EDGE_ID=$(${edgeIdScript}) \n\n`
    : '';
  const envVarsTrimmed = envVars.trim();
  const edgeIdVar = !edgeIdScript && edgeId ? edgeId : '$PORTAINER_EDGE_ID';
  const selfSigned = allowSelfSignedCerts ? '1' : '0';

  return `${idEnvVar}curl https://downloads.portainer.io/ce${agentShortVersion}/portainer-edge-agent-setup.sh | bash -s -- "${edgeIdVar}" "${edgeKey}" "${selfSigned}" "${agentSecret}" "${envVarsTrimmed}"`;
}

function buildDefaultEnvVars(
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  edgeId = '$PORTAINER_EDGE_ID',
  agentSecret = ''
) {
  return _.compact([
    'EDGE=1',
    `EDGE_ID=${edgeId}`,
    `EDGE_KEY=${edgeKey}`,
    `EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0}`,
    agentSecret ? `AGENT_SECRET=${agentSecret}` : ``,
  ]);
}
