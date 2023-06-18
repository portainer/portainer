import { useQueryClient, useMutation } from 'react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import {
  EnvironmentId,
  EnvironmentStatusMessage,
  Environment,
} from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { TagId } from '@/portainer/tags/types';

import { EnvironmentGroupId } from '../environment-groups/types';
import { buildUrl } from '../environment.service/utils';

import { queryKeys } from './query-keys';

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation(updateEnvironment, {
    ...withInvalidate(queryClient, [queryKeys.base()]),
    ...withError('Unable to update environment'),
  });
}

export interface UpdatePayload {
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
  StatusMessage: Partial<EnvironmentStatusMessage>;
}

async function updateEnvironment({
  id,
  payload,
}: {
  id: EnvironmentId;
  payload: Partial<UpdatePayload>;
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
