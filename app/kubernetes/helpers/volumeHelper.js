import _ from 'lodash-es';
import uuidv4 from 'uuid/v4';

class KubernetesVolumeHelper {
  static getUsingApplications(volume, applications) {
    return _.filter(applications, (app) => {
      const names = _.without(_.map(app.Volumes, 'persistentVolumeClaim.claimName'), undefined);
      const matchingNames = _.filter(names, (name) => _.startsWith(volume.PersistentVolumeClaim.Name, name));
      return volume.ResourcePool.Namespace.Name === app.ResourcePool && matchingNames.length;
    });
  }

  static isUsed(item) {
    return item.Applications.length !== 0;
  }

  static generatedApplicationConfigVolumeName(name) {
    return 'config-' + name + '-' + uuidv4();
  }
}

export default KubernetesVolumeHelper;
