import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export type ServiceAccountDetails = {
  name: string;
  uid: string;
  namespace: string;
  creationDate: string;
  isSystem: boolean;
  automountServiceAccountToken?: boolean;
  imagePullSecrets?: Array<{ name: string }>;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
};

export function useServiceAccount(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  return useQuery(
    queryKeys.detail(environmentId, namespace, name),
    async () => getServiceAccount(environmentId, namespace, name),
    {
      enabled: !!environmentId && !!namespace && !!name,
      ...withError('Unable to get service account'),
    }
  );
}

async function getServiceAccount(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    const { data } = await axios.get<ServiceAccountDetails>(
      `kubernetes/${environmentId}/namespaces/${namespace}/service_accounts/${name}`
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get service account');
  }
}
