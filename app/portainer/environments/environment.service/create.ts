import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';

import { Environment, EnvironmentGroupId, EnvironmentCreationTypes, TagId } from '../types';

import { arrayToJson, buildUrl, json2formData } from './utils';

export async function createLocalEndpoint(name = 'local', URL: string, publicUrl: string, groupId: EnvironmentGroupId = 1, tagIds: TagId[] = []) {
  let endpointURL = URL;
  if (endpointURL !== '') {
    if (endpointURL.includes('//./pipe/')) {
      endpointURL = `unix://${URL}`;
    } else {
      // Windows named pipe
      endpointURL = `npipe://${URL}`;
    }
  }
  try {
    return await createEndpoint(name, EnvironmentCreationTypes.LocalDockerEnvironment, { url: endpointURL, publicUrl, groupId, tagIds });
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
  }
}

export async function createLocalKubernetesEndpoint(name = 'local', tagIds: TagId[] = []) {
  try {
    return await createEndpoint(name, EnvironmentCreationTypes.LocalKubernetesEnvironment, { tagIds, groupId: 1, tls: { skipClientVerify: true, skipVerify: true } });
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
  }
}

export async function createAzureEndpoint(name: string, applicationId: string, tenantId: string, authenticationKey: string, groupId: EnvironmentGroupId, tagIds: TagId[]) {
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

export async function createRemoteEndpoint(
  name: string,
  creationType: EnvironmentCreationTypes,
  url: string,
  publicUrl: string,
  groupId: EnvironmentGroupId,
  tagIds: TagId[],
  tls: boolean,
  tlsSkipVerify?: boolean,
  tlsSkipClientVerify?: boolean,
  tlsCAFile?: File,
  tlsCertFile?: File,
  tlsKeyFile?: File,
  checkinInterval?: number
) {
  let endpointUrl = url;
  if (creationType !== EnvironmentCreationTypes.EdgeAgentEnvironment) {
    endpointUrl = `tcp://${url}`;
  }

  try {
    return await createEndpoint(name, creationType, {
      url: endpointUrl,
      publicUrl,
      groupId,
      tagIds,

      checkinInterval,
      tls: tls
        ? {
            skipVerify: tlsSkipVerify,
            skipClientVerify: tlsSkipClientVerify,
            caCertFile: tlsCAFile,
            certFile: tlsCertFile,
            keyFile: tlsKeyFile,
          }
        : undefined,
    });
  } catch (err) {
    throw new PortainerError('Unable to create environment', err as Error);
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
}

async function createEndpoint(name: string, creationType: EnvironmentCreationTypes, options?: EndpointOptions) {
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

  const { data: endpoint } = await axios.post<Environment>(buildUrl(), formPayload);

  return endpoint;
}
