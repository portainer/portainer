import { KubernetesApplication } from '@/kubernetes/models/application/models';

export type NodeApplication = KubernetesApplication & {
  CPU: number;
  Memory: number;
};
