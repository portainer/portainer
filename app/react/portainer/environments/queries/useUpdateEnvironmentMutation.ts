import { useQueryClient, useMutation } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import {
  EnvironmentId,
  EnvironmentStatusMessage,
  Environment,
  KubernetesSettings,
  EndpointChangeWindow,
  DeploymentOptions,
} from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from '../environment.service/utils';
import { Pair } from '../../settings/types';
import {
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../../registries/types/registry';

import { environmentQueryKeys } from './query-keys';

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation(updateEnvironment, {
    ...withInvalidate(queryClient, [environmentQueryKeys.base()]),
    ...withError('Unable to update environment'),
  });
}

interface TLSFiles {
  TLSCACert?: File;
  TLSCert?: File;
  TLSKey?: File;
}

export interface UpdateEnvironmentPayload extends TLSFiles {
  /**
   * Name that will be used to identify this environment(endpoint)
   */
  Name?: string;

  /**
   * URL or IP address of a Docker host
   */
  URL?: string;

  /**
   * URL or IP address where exposed containers will be reachable. Defaults to URL if not specified
   */
  PublicURL?: string;

  /**
   * GPUs information
   */
  Gpus?: Pair[];

  /**
   * Group identifier
   */
  GroupID?: number;

  /**
   * Require TLS to connect against this environment(endpoint)
   */
  TLS?: boolean;

  /**
   * Skip server verification when using TLS
   */
  TLSSkipVerify?: boolean;

  /**
   * Skip client verification when using TLS
   */
  TLSSkipClientVerify?: boolean;

  /**
   * The status of the environment(endpoint) (1 - up, 2 - down)
   */
  Status?: number;

  /**
   * Azure application ID
   */
  AzureApplicationID?: string;

  /**
   * Azure tenant ID
   */
  AzureTenantID?: string;

  /**
   * Azure authentication key
   */
  AzureAuthenticationKey?: string;

  /**
   * List of tag identifiers to which this environment(endpoint) is associated
   */
  TagIDs?: number[];

  /**
   * User access policies for the environment
   */
  UserAccessPolicies?: UserAccessPolicies;

  /**
   * Team access policies for the environment
   */
  TeamAccessPolicies?: TeamAccessPolicies;

  /**
   * Associated Kubernetes data
   */
  Kubernetes?: KubernetesSettings;

  /**
   * Whether GitOps update time restrictions are enabled
   */
  ChangeWindow?: EndpointChangeWindow;

  /**
   * Hide manual deployment forms for an environment
   */
  DeploymentOptions?: DeploymentOptions;

  /**
   * The check-in interval for edge agent (in seconds)
   */
  EdgeCheckinInterval?: number;

  Edge?: {
    PingInterval?: number;
    SnapshotInterval?: number;
    CommandInterval?: number;
  };

  IsSetStatusMessage?: boolean;

  StatusMessage?: EnvironmentStatusMessage;
}

export async function updateEnvironment({
  id,
  payload,
}: {
  id: EnvironmentId;
  payload: Partial<UpdateEnvironmentPayload>;
}) {
  try {
    await uploadTLSFilesForEndpoint(
      id,
      payload.TLSCACert,
      payload.TLSCert,
      payload.TLSKey
    );

    const { data: endpoint } = await axios.put<Environment>(
      buildUrl(id),
      payload
    );

    return endpoint;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update environment');
  }
}

async function uploadTLSFilesForEndpoint(
  id: EnvironmentId,
  tlscaCert?: File,
  tlsCert?: File,
  tlsKey?: File
) {
  await Promise.all([
    uploadCert('ca', tlscaCert),
    uploadCert('cert', tlsCert),
    uploadCert('key', tlsKey),
  ]);

  function uploadCert(type: 'ca' | 'cert' | 'key', cert?: File) {
    if (!cert) {
      return null;
    }
    try {
      return axios.post<void>(`upload/tls/${type}`, cert, {
        params: { folder: id },
      });
    } catch (e) {
      throw parseAxiosError(e as Error);
    }
  }
}
