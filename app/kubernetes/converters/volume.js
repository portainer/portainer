import _ from 'lodash-es';
import { KubernetesVolume } from 'Kubernetes/models/volume/models';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

class KubernetesVolumeConverter {
  static pvcToVolume(claim, pools, applications) {
    const res = new KubernetesVolume();
    res.PersistentVolumeClaim = claim;
    res.ResourcePool = _.find(pools, (item) => item.Namespace.Name === claim.Namespace);
    res.Applications = KubernetesVolumeHelper.getUsingApplications(res, applications);
    return res;
  }
}

export default KubernetesVolumeConverter;