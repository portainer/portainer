import { KubernetesVolume } from 'Kubernetes/models/volume/models';

class KubernetesVolumeConverter {
  static apiToVolume(pvc, pv, pool) {
    const res = new KubernetesVolume();
    res.PersistentVolumeClaim = pvc;
    res.PersistentVolume = pv;
    res.ResourcePool = pool;
    return res;
  }
}

export default KubernetesVolumeConverter;
