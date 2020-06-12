import _ from 'lodash-es';
import uuidv4 from 'uuid/v4';
import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models';

class KubernetesVolumeHelper {
  // TODO: review
  // the following condition
  // && (app.ApplicationType === KubernetesApplicationTypes.STATEFULSET ? _.includes(volume.PersistentVolumeClaim.Name, app.Name) : true);
  // is made to enforce finding the good SFS when multiple SFS in the same namespace
  // are referencing an internal PVC using the same internal name
  // (PVC are not exposed to other apps so they can have the same name in differents SFS)
  static getUsingApplications(volume, applications) {
    return _.filter(applications, (app) => {
      const names = _.without(_.map(app.Volumes, 'persistentVolumeClaim.claimName'), undefined);
      const matchingNames = _.filter(names, (name) => _.startsWith(volume.PersistentVolumeClaim.Name, name));
      return (
        volume.ResourcePool.Namespace.Name === app.ResourcePool &&
        matchingNames.length &&
        (app.ApplicationType === KubernetesApplicationTypes.STATEFULSET ? _.includes(volume.PersistentVolumeClaim.Name, app.Name) : true)
      );
    });
  }

  static isUsed(item) {
    return item.Applications.length !== 0;
  }

  static generatedApplicationConfigVolumeName(name) {
    return 'config-' + name + '-' + uuidv4();
  }

  static isExternalVolume(volume) {
    return !volume.PersistentVolumeClaim.ApplicationOwner;
  }
}

export default KubernetesVolumeHelper;
