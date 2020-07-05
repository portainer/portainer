import { KubernetesVolume } from 'Kubernetes/models/volume/models';

class KubernetesVolumeConverter {
  static pvcToVolume(claim, pool) {
    const res = new KubernetesVolume();
    res.PersistentVolumeClaim = claim;
    res.ResourcePool = pool;
    return res;
  }
}

export default KubernetesVolumeConverter;
