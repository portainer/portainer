import { IngressClassList } from 'kubernetes-types/networking/v1';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getAllIngressClasses(environmentId: EnvironmentId) {
  try {
    const {
      data: { items },
    } = await axios.get<IngressClassList>(urlBuilder(environmentId));
    return items;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

function urlBuilder(environmentId: EnvironmentId) {
  return `endpoints/${environmentId}/kubernetes/apis/networking.k8s.io/v1/ingressclasses`;
}
