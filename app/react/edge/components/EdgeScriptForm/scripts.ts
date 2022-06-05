import _ from 'lodash';

import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';

import { ScriptFormValues, Platform } from './types';

type CommandGenerator = (
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) => string;

export type CommandTab = {
  id: Platform;
  label: string;
  command: CommandGenerator;
};

export const commandsTabs: Record<string, CommandTab> = {
  k8sLinux: {
    id: 'k8s',
    label: 'Kubernetes',
    command: buildLinuxKubernetesCommand,
  },
  swarmLinux: {
    id: 'swarm',
    label: 'Docker Swarm',
    command: buildLinuxSwarmCommand,
  },
  standaloneLinux: {
    id: 'standalone',
    label: 'Docker Standalone',
    command: buildLinuxStandaloneCommand,
  },
  swarmWindows: {
    id: 'swarm',
    label: 'Docker Swarm',
    command: buildWindowsSwarmCommand,
  },
  standaloneWindow: {
    id: 'standalone',
    label: 'Docker Standalone',
    command: buildWindowsStandaloneCommand,
  },
} as const;

function buildDockerEnvVars(envVars: string, defaultVars: string[]) {
  const vars = defaultVars.concat(
    envVars.split(',').filter((s) => s.length > 0)
  );

  return vars.map((s) => `-e ${s}`).join(' \\\n  ');
}

export function buildLinuxStandaloneCommand(
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) {
  const { allowSelfSignedCertificates, edgeIdGenerator, envVars } = properties;

  const env = buildDockerEnvVars(
    envVars,
    buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCertificates,
      !edgeIdGenerator ? edgeId : undefined,
      agentSecret
    )
  );

  return `${
    edgeIdGenerator ? `PORTAINER_EDGE_ID=$(${edgeIdGenerator}) \n\n` : ''
  }\
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

export function buildWindowsStandaloneCommand(
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) {
  const { allowSelfSignedCertificates, edgeIdGenerator, envVars } = properties;

  const env = buildDockerEnvVars(
    envVars,
    buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCertificates,
      edgeIdGenerator ? '$Env:PORTAINER_EDGE_ID' : edgeId,
      agentSecret
    )
  );

  return `${
    edgeIdGenerator
      ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdGenerator})" \n\n`
      : ''
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

export function buildLinuxSwarmCommand(
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) {
  const { allowSelfSignedCertificates, edgeIdGenerator, envVars } = properties;

  const env = buildDockerEnvVars(envVars, [
    ...buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCertificates,
      !edgeIdGenerator ? edgeId : undefined,
      agentSecret
    ),
    'AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent',
  ]);

  return `${
    edgeIdGenerator ? `PORTAINER_EDGE_ID=$(${edgeIdGenerator}) \n\n` : ''
  }\
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

export function buildWindowsSwarmCommand(
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) {
  const { allowSelfSignedCertificates, edgeIdGenerator, envVars } = properties;

  const env = buildDockerEnvVars(envVars, [
    ...buildDefaultEnvVars(
      edgeKey,
      allowSelfSignedCertificates,
      edgeIdGenerator ? '$Env:PORTAINER_EDGE_ID' : edgeId,
      agentSecret
    ),
    'AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent',
  ]);

  return `${
    edgeIdGenerator
      ? `$Env:PORTAINER_EDGE_ID = "@(${edgeIdGenerator})" \n\n`
      : ''
  }\
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

export function buildLinuxKubernetesCommand(
  agentVersion: string,
  edgeKey: string,
  properties: ScriptFormValues,
  edgeId?: string,
  agentSecret?: string
) {
  const { allowSelfSignedCertificates, edgeIdGenerator, envVars } = properties;

  const agentShortVersion = getAgentShortVersion(agentVersion);
  const envVarsTrimmed = envVars.trim();
  const idEnvVar = edgeIdGenerator
    ? `PORTAINER_EDGE_ID=$(${edgeIdGenerator}) \n\n`
    : '';
  const edgeIdVar = !edgeIdGenerator && edgeId ? edgeId : '$PORTAINER_EDGE_ID';
  const selfSigned = allowSelfSignedCertificates ? '1' : '0';

  return `${idEnvVar}curl https://downloads.portainer.io/ee${agentShortVersion}/portainer-edge-agent-setup.sh | bash -s -- "${edgeIdVar}" "${edgeKey}" "${selfSigned}" "${agentSecret}" "${envVarsTrimmed}"`;
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
