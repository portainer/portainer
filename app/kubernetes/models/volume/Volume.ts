import { KubernetesApplication } from '../application/models';
import { KubernetesResourcePool } from '../resource-pool/models';

import { PersistentVolumeClaim } from './PersistentVolumeClaim';

type VolumeResourcePool = ReturnType<typeof KubernetesResourcePool>;

export class Volume {
  ResourcePool?: VolumeResourcePool = {} as VolumeResourcePool;

  PersistentVolumeClaim: PersistentVolumeClaim = {} as PersistentVolumeClaim;

  Applications: KubernetesApplication[] = [];
}
