import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  KubernetesApiListResponse,
  V1IngressClass,
} from '@/react/kubernetes/services/kubernetes/types';

export async function getAllIngressClasses(environmentId: EnvironmentId) {
  try {
    const {
      data: { items },
    } = await axios.get<KubernetesApiListResponse<V1IngressClass[]>>(
      urlBuilder(environmentId)
    );
    return items;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

function urlBuilder(environmentId: EnvironmentId) {
  return `endpoints/${environmentId}/kubernetes/apis/networking.k8s.io/v1/ingressclasses`;
}
