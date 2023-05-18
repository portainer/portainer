import axios, { parseAxiosError } from '@/portainer/services/axios';
import { type EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';
import { type TagId } from '@/portainer/tags/types';
import { EdgeAsyncIntervalsValues } from '@/react/edge/components/EdgeAsyncIntervalsForm';

import { type Environment, EnvironmentCreationTypes } from '../types';

import { arrayToJson, buildUrl, json2formData } from './utils';

export interface EnvironmentMetadata {
  groupId?: EnvironmentGroupId;
  tagIds?: TagId[];
}

interface CreateLocalDockerEnvironment {
  name: string;
  socketPath?: string;
  publicUrl?: string;
  meta?: EnvironmentMetadata;
}

export async function createLocalDockerEnvironment({
  name,
  socketPath = '',
  publicUrl = '',
  meta = { tagIds: [] },
}: CreateLocalDockerEnvironment) {
  const url = prefixPath(socketPath);

  return createEnvironment(
    name,
    EnvironmentCreationTypes.LocalDockerEnvironment,
    {
      url,
      publicUrl,
      meta,
    }
  );

  function prefixPath(path: string) {
    if (path === '') {
      return path;
    }

    // Windows named pipe
    if (path.startsWith('//./pipe/')) {
      return `npipe://${path}`;
    }

    return `unix://${path}`;
  }
}

interface CreateLocalKubernetesEnvironment {
  name: string;
  meta?: EnvironmentMetadata;
}

export async function createLocalKubernetesEnvironment({
  name,
  meta = { tagIds: [] },
}: CreateLocalKubernetesEnvironment) {
  return createEnvironment(
    name,
    EnvironmentCreationTypes.LocalKubernetesEnvironment,
    { meta, tls: { skipClientVerify: true, skipVerify: true } }
  );
}

interface AzureSettings {
  applicationId: string;
  tenantId: string;
  authenticationKey: string;
}

interface CreateAzureEnvironment {
  name: string;
  azure: AzureSettings;
  meta?: EnvironmentMetadata;
}

export async function createAzureEnvironment({
  name,
  azure,
  meta = { tagIds: [] },
}: CreateAzureEnvironment) {
  return createEnvironment(name, EnvironmentCreationTypes.AzureEnvironment, {
    meta,
    azure,
  });
}

interface TLSSettings {
  skipVerify?: boolean;
  skipClientVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
}

interface EdgeSettings extends EdgeAsyncIntervalsValues {
  asyncMode: boolean;
}

export interface EnvironmentOptions {
  url?: string;
  publicUrl?: string;
  meta?: EnvironmentMetadata;
  azure?: AzureSettings;
  tls?: TLSSettings;
  pollFrequency?: number;
  edge?: EdgeSettings;
  tunnelServerAddr?: string;
}

interface CreateRemoteEnvironment {
  name: string;
  creationType: Exclude<
    EnvironmentCreationTypes,
    EnvironmentCreationTypes.EdgeAgentEnvironment
  >;
  url: string;
  options?: Omit<EnvironmentOptions, 'url'>;
}

export async function createRemoteEnvironment({
  creationType,
  name,
  url,
  options = {},
}: CreateRemoteEnvironment) {
  return createEnvironment(name, creationType, {
    ...options,
    url: `tcp://${url}`,
  });
}

export interface CreateAgentEnvironmentValues {
  name: string;
  environmentUrl: string;
  meta: EnvironmentMetadata;
}

export function createAgentEnvironment({
  name,
  environmentUrl,
  meta = { tagIds: [] },
}: CreateAgentEnvironmentValues) {
  return createRemoteEnvironment({
    name,
    url: environmentUrl,
    creationType: EnvironmentCreationTypes.AgentEnvironment,
    options: {
      meta,
      tls: {
        skipVerify: true,
        skipClientVerify: true,
      },
    },
  });
}

interface CreateEdgeAgentEnvironment {
  name: string;
  portainerUrl: string;
  tunnelServerAddr?: string;
  meta?: EnvironmentMetadata;
  pollFrequency: number;
  edge: EdgeSettings;
}

export function createEdgeAgentEnvironment({
  name,
  portainerUrl,
  meta = { tagIds: [] },
  pollFrequency,
  edge,
}: CreateEdgeAgentEnvironment) {
  return createEnvironment(
    name,
    EnvironmentCreationTypes.EdgeAgentEnvironment,
    {
      url: portainerUrl,
      tls: {
        skipVerify: true,
        skipClientVerify: true,
      },
      pollFrequency,
      edge,
      meta,
    }
  );
}

async function createEnvironment(
  name: string,
  creationType: EnvironmentCreationTypes,
  options?: EnvironmentOptions
) {
  let payload: Record<string, unknown> = {
    Name: name,
    EndpointCreationType: creationType,
  };

  if (options) {
    const { groupId, tagIds = [] } = options.meta || {};

    payload = {
      ...payload,
      URL: options.url,
      PublicURL: options.publicUrl,
      GroupID: groupId,
      TagIds: arrayToJson(tagIds),
      EdgeCheckinInterval: options.pollFrequency,
    };

    const { tls, azure } = options;

    if (tls) {
      payload = {
        ...payload,
        TLS: true,
        TLSSkipVerify: tls.skipVerify,
        TLSSkipClientVerify: tls.skipClientVerify,
        TLSCACertFile: tls.caCertFile,
        TLSCertFile: tls.certFile,
        TLSKeyFile: tls.keyFile,
      };
    }

    if (azure) {
      payload = {
        ...payload,
        AzureApplicationID: azure.applicationId,
        AzureTenantID: azure.tenantId,
        AzureAuthenticationKey: azure.authenticationKey,
      };
    }

    if (options.edge?.asyncMode) {
      payload = {
        ...payload,
        EdgeAsyncMode: true,
        EdgePingInterval: options.edge?.PingInterval,
        EdgeSnapshotInterval: options.edge?.SnapshotInterval,
        EdgeCommandInterval: options.edge?.CommandInterval,
      };
    }
  }

  const formPayload = json2formData(payload);
  try {
    const { data } = await axios.post<Environment>(buildUrl(), formPayload);

    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
