import { humanize } from '@/portainer/filters/filters';

import { K8sVolumeInfo } from '../types';
import { VolumeViewModel } from '../ListView/types';
import { appOwnerLabel } from '../../applications/constants';

export function convertToVolumeViewModels(
  volumes: K8sVolumeInfo[]
): VolumeViewModel[] {
  return volumes.map((volume) => {
    const owningApplications =
      volume.persistentVolumeClaim.owningApplications ?? [];
    return {
      Applications: owningApplications.map((app) => ({
        Name: app.Name,
        ResourcePool: app.ResourcePool,
        Namespace: app.Namespace,
        Kind: app.Kind,
      })),
      PersistentVolumeClaim: {
        Namespace: volume.persistentVolumeClaim.namespace,
        Name: volume.persistentVolumeClaim.name,
        storageClass: {
          Name: volume.persistentVolumeClaim.storageClass || '',
        },
        Storage: humanize(volume.persistentVolumeClaim.storage),
        CreationDate: volume.persistentVolumeClaim.creationDate,
        ApplicationOwner:
          volume.persistentVolumeClaim.owningApplications?.[0]?.Name,
        IsExternal: !volume.persistentVolumeClaim.labels?.[appOwnerLabel],
      },
      ResourcePool: {
        Namespace: {
          Name: volume.persistentVolumeClaim.namespace,
        },
      },
    };
  });
}
