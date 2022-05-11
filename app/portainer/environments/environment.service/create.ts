import PortainerError from '@/portainer/error';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { type EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { type TagId } from '@/portainer/tags/types';

import { type Environment, EnvironmentCreationTypes } from '../types';

import { arrayToJson, buildUrl, json2formData } from './utils';

export async function createLocalEndpoint(
  name = 'local',
  url = '',
  publicUrl = '',
  groupId: EnvironmentGroupId = 1,
  tagIds: TagId[] = []
) {
  let endpointUrl = url;
  if (endpointUrl !== '') {
    if (endpointUrl.includes('//./pipe/')) {
      endpointUrl = `unix://${url}`;
    } else {
      // Windows named pipe
      endpointUrl = `npipe://${url}`;
    }
  }

  try {
    return await createEndpoint(
      name,
      EnvironmentCreationTypes.LocalDockerEnvironment,
      { url: endpointUrl, publicUrl, groupId, tagIds }
    );
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
  }
}

export async function createLocalKubernetesEndpoint(
  name = 'local',
  tagIds: TagId[] = []
) {
  try {
    return await createEndpoint(
      name,
      EnvironmentCreationTypes.LocalKubernetesEnvironment,
      { tagIds, groupId: 1, tls: { skipClientVerify: true, skipVerify: true } }
    );
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
  }
}

export async function createAzureEndpoint(
  name: string,
  applicationId: string,
  tenantId: string,
  authenticationKey: string,
  groupId: EnvironmentGroupId,
  tagIds: TagId[]
) {
  try {
    await createEndpoint(name, EnvironmentCreationTypes.AzureEnvironment, {
      groupId,
      tagIds,
      azure: { applicationId, tenantId, authenticationKey },
    });
  } catch (err) {
    throw new PortainerError('Unable to connect to Azure', err as Error);
  }
}

interface TLSSettings {
  skipVerify?: boolean;
  skipClientVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
}

interface AzureSettings {
  applicationId: string;
  tenantId: string;
  authenticationKey: string;
}

interface EndpointOptions {
  url?: string;
  publicUrl?: string;
  groupId?: EnvironmentGroupId;
  tagIds?: TagId[];
  checkinInterval?: number;
  azure?: AzureSettings;
  tls?: TLSSettings;
  isEdgeDevice?: boolean;
}

export async function createRemoteEndpoint(
  name: string,
  creationType: EnvironmentCreationTypes,
  options?: EndpointOptions
) {
  let endpointUrl = options?.url;
  if (creationType !== EnvironmentCreationTypes.EdgeAgentEnvironment) {
    endpointUrl = `tcp://${endpointUrl}`;
  }

  try {
    return await createEndpoint(name, creationType, {
      ...options,
      url: endpointUrl,
    });
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
  }
}

async function createEndpoint(
  name: string,
  creationType: EnvironmentCreationTypes,
  options?: EndpointOptions
) {
  let payload: Record<string, unknown> = {
    Name: name,
    EndpointCreationType: creationType,
  };

  if (options) {
    payload = {
      ...payload,
      URL: options.url,
      PublicURL: options.publicUrl,
      GroupID: options.groupId,
      TagIds: arrayToJson(options.tagIds),
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
    const { data: endpoint } = await axios.post<Environment>(
      buildUrl(),
      formPayload
    );

    return endpoint;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
