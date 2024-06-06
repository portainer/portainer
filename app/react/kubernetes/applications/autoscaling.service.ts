import {
  HorizontalPodAutoscaler,
  HorizontalPodAutoscalerList,
} from 'kubernetes-types/autoscaling/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../axiosError';

// when yaml is set to true, the expected return type is a string
export function useHorizontalAutoScalarQuery<
  T extends HorizontalPodAutoscaler | string = HorizontalPodAutoscaler,
>(
  environmentId: EnvironmentId,
  namespace: string,
  name?: string,
  options?: { yaml?: boolean }
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespaces',
      namespace,
      'horizontalpodautoscalers',
      name,
      options?.yaml,
    ],
    () =>
      name
        ? getNamespaceHorizontalPodAutoscaler<T>(
            environmentId,
            namespace,
            name,
            options
          )
        : undefined,
    { ...withError('Unable to get horizontal pod autoscaler'), enabled: !!name }
  );
}

export async function getNamespaceHorizontalPodAutoscalers(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: autoScalarList } =
      await axios.get<HorizontalPodAutoscalerList>(
        `/endpoints/${environmentId}/kubernetes/apis/autoscaling/v1/namespaces/${namespace}/horizontalpodautoscalers`
      );
    return autoScalarList.items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve horizontal pod autoscalers'
    );
  }
}

export async function getNamespaceHorizontalPodAutoscaler<
  T extends HorizontalPodAutoscaler | string = HorizontalPodAutoscaler,
>(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  options?: { yaml?: boolean }
) {
  try {
    const { data: autoScalar } = await axios.get<T>(
      `/endpoints/${environmentId}/kubernetes/apis/autoscaling/v1/namespaces/${namespace}/horizontalpodautoscalers/${name}`,
      {
        headers: {
          Accept: options?.yaml ? 'application/yaml' : 'application/json',
        },
      }
    );
    return autoScalar;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve horizontal pod autoscaler'
    );
  }
}
