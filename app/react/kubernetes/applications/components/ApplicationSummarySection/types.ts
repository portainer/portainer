import { AppKind } from '../../types';

export type KubernetesResourceAction = 'Create' | 'Update' | 'Delete';

export type KubernetesResourceType =
  | AppKind
  | 'Namespace'
  | 'ResourceQuota'
  | 'ConfigMap'
  | 'Secret'
  | 'PersistentVolumeClaim'
  | 'Service'
  | 'Ingress'
  | 'HorizontalPodAutoscaler';

export type Summary = {
  action: KubernetesResourceAction;
  kind: KubernetesResourceType;
  name: string;
  type?: string;
};
