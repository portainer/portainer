import _ from 'lodash-es';

class KubernetesVolumeHelper {
  static getUsingApplications(volume, applications) {
    return _.filter(applications, (app) => {
      const names = _.without(_.map(app.Volumes, 'persistentVolumeClaim.claimName'), undefined);
      const matchingNames = _.filter(names, (name) => _.startsWith(volume.PersistentVolumeClaim.Name, name));
      return volume.ResourcePool.Namespace.Name === app.ResourcePool && matchingNames.length;
    });
  }
}

export default KubernetesVolumeHelper;
