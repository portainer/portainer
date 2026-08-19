import { KubernetesApplication } from '@/kubernetes/models/application/models';

export interface NamespaceApp extends KubernetesApplication {
  CPU: number;
  Memory: number;
}
