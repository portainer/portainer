import axios, { parseAxiosError } from '@/portainer/services/axios';
import { type EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { type TagId } from '@/portainer/tags/types';

import { type Environment, EnvironmentCreationTypes } from '../types';

import { arrayToJson, buildUrl, json2formData } from './utils';

interface Meta {
  groupId?: EnvironmentGroupId;
  tagIds?: TagId[];
}

interface CreateLocalEnvironment {
  name: string;
  socketPath?: string;
  publicUrl?: string;
  meta?: Meta;
}

export async function createLocalEnvironment({
  name = 'local',
  socketPath = '',
  publicUrl = '',
  meta = { tagIds: [] },
}: CreateLocalEnvironment) {
  const url = prefixPath(socketPath);

  return createEnvironment(
    name,
    EnvironmentCreationTypes.LocalDockerEnvironment,
    {
      url,
      publicUrl,
      ...meta,
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
  meta?: Meta;
}

export async function createLocalKubernetesEnvironment({
  name = 'local',
  meta = { tagIds: [] },
}: CreateLocalKubernetesEnvironment) {
  return createEnvironment(
    name,
    EnvironmentCreationTypes.LocalKubernetesEnvironment,
    { ...meta, tls: { skipClientVerify: true, skipVerify: true } }
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
  meta?: Meta;
}

export async function createAzureEnvironment({
  name,
  azure,
  meta = { tagIds: [] },
}: CreateAzureEnvironment) {
  return createEnvironment(name, EnvironmentCreationTypes.AzureEnvironment, {
    ...meta,
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

export interface EnvironmentOptions {
  url?: string;
  publicUrl?: string;
  meta?: Meta;
  checkinInterval?: number;
  azure?: AzureSettings;
  tls?: TLSSettings;
  isEdgeDevice?: boolean;
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

interface CreateAgentEnvironment {
  name: string;
  environmentUrl: string;
  meta?: Meta;
}

export function createAgentEnvironment({
  name,
  environmentUrl,
  meta = { tagIds: [] },
}: CreateAgentEnvironment) {
  return createRemoteEnvironment({
    name,
    url: environmentUrl,
    creationType: EnvironmentCreationTypes.AgentEnvironment,
    options: {
      ...meta,
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
  meta?: Meta;
  pollFrequency: number;
}

export function createEdgeAgentEnvironment({
  name,
  portainerUrl,
  meta = { tagIds: [] },
}: CreateEdgeAgentEnvironment) {
  return createEnvironment(
    name,
    EnvironmentCreationTypes.EdgeAgentEnvironment,
    {
      url: portainerUrl,
      ...meta,
      tls: {
        skipVerify: true,
        skipClientVerify: true,
      },
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
      CheckinInterval: options.checkinInterval,
      IsEdgeDevice: options.isEdgeDevice,
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
  }

  const formPayload = json2formData(payload);
  try {
    const { data } = await axios.post<Environment>(buildUrl(), formPayload);

    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
