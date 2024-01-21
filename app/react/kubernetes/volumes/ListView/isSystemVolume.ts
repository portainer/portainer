import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { VolumeViewModel } from './types';

export function isSystemVolume(item: VolumeViewModel) {
  return KubernetesNamespaceHelper.isSystemNamespace(
    item.ResourcePool.Namespace.Name
  );
}
