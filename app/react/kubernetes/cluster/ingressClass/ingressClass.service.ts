import { IngressClassList } from 'kubernetes-types/networking/v1';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { parseKubernetesAxiosError } from '../../axiosError';

export async function getAllIngressClasses(environmentId: EnvironmentId) {
  try {
    const {
      data: { items },
    } = await axios.get<IngressClassList>(urlBuilder(environmentId));
    return items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve ingress classes');
  }
}

function urlBuilder(environmentId: EnvironmentId) {
  return `endpoints/${environmentId}/kubernetes/apis/networking.k8s.io/v1/ingressclasses`;
}
