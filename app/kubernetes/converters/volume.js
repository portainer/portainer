import _ from 'lodash-es';
import { KubernetesVolume } from 'Kubernetes/models/volume/models';

class KubernetesVolumeConverter {
  static pvcToVolume(claim, pools) {
    const res = new KubernetesVolume();
    claim.Storage = claim.Storage.replace('i', '');
    res.PersistentVolumeClaim = claim;
    res.ResourcePool = _.find(pools, (item) => item.Namespace.Name === claim.Namespace);
    return res;
  }
}

export default KubernetesVolumeConverter;