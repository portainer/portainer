import { HorizontalPodAutoscalerList } from 'kubernetes-types/autoscaling/v1';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getNamespaceHorizontalPodAutoscalers(
  environmentId: EnvironmentId,
  namespace: string
) {
  const { data: autoScalarList } = await axios.get<HorizontalPodAutoscalerList>(
    `/endpoints/${environmentId}/kubernetes/apis/autoscaling/v1/namespaces/${namespace}/horizontalpodautoscalers`
  );
  return autoScalarList.items;
}
