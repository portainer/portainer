import { useQueryClient, useMutation } from '@tanstack/react-query';

import {
  EndpointsEndpointUpdatePayload,
  PortainerEndpoint,
} from '@api/types.gen';

import { withError, withInvalidate } from '@/react-tools/react-query';
import {
  EnvironmentId,
  EnvironmentStatusMessage,
  KubernetesSettings,
} from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { buildUrl, toEnvironment } from '../environment.service/utils';

import { environmentQueryKeys } from './query-keys';

export function useUpdateEnvironmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEnvironment,
    ...withInvalidate(queryClient, [environmentQueryKeys.base()]),
    ...withError('Unable to update environment'),
  });
}

export type UpdateEnvironmentPayload = Omit<
  EndpointsEndpointUpdatePayload,
  'Kubernetes'
> & {
  Kubernetes?: KubernetesSettings;
  TLSCACert: File | undefined;
  TLSCert: File | undefined;
  TLSKey: File | undefined;
  IsSetStatusMessage?: boolean;
  StatusMessage?: EnvironmentStatusMessage;
};

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

    const { data } = await axios.put<PortainerEndpoint>(buildUrl(id), payload);

    return toEnvironment(data);
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
    const formData = new FormData();
    formData.append('file', cert);
    try {
      return axios.post<void>(`upload/tls/${type}`, formData, {
        params: { folder: id },
      });
    } catch (e) {
      throw parseAxiosError(e as Error);
    }
  }
}
