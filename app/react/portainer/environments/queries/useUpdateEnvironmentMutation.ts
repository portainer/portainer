import { useQueryClient, useMutation } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import {
  EnvironmentId,
  EnvironmentStatusMessage,
  Environment,
  KubernetesSettings,
  DeploymentOptions,
  EndpointChangeWindow,
  EnvironmentGroupId,
} from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TagId } from '@/portainer/tags/types';

import { buildUrl } from '../environment.service/utils';

import { environmentQueryKeys } from './query-keys';

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation(updateEnvironment, {
    ...withInvalidate(queryClient, [environmentQueryKeys.base()]),
    ...withError('Unable to update environment'),
  });
}

export interface UpdateEnvironmentPayload extends Partial<Environment> {
  TLSCACert?: File;
  TLSCert?: File;
  TLSKey?: File;

  Name: string;
  PublicURL: string;
  GroupID: EnvironmentGroupId;
  TagIds: TagId[];

  EdgeCheckinInterval: number;

  TLS: boolean;
  TLSSkipVerify: boolean;
  TLSSkipClientVerify: boolean;
  AzureApplicationID: string;
  AzureTenantID: string;
  AzureAuthenticationKey: string;

  IsSetStatusMessage: boolean;
  StatusMessage: EnvironmentStatusMessage;
  Kubernetes?: KubernetesSettings;
  DeploymentOptions?: DeploymentOptions | null;
  ChangeWindow?: EndpointChangeWindow;
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
