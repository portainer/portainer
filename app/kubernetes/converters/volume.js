import { KubernetesVolume } from 'Kubernetes/models/volume/models';

class KubernetesVolumeConverter {
  static pvcToVolume(claim, pool) {
    const res = new KubernetesVolume();
    claim.Storage = claim.Storage.replace('i', '');
    res.PersistentVolumeClaim = claim;
    res.ResourcePool = pool;
    return res;
  }
}

export default KubernetesVolumeConverter;