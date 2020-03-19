import _ from 'lodash-es';

class KubernetesVolumeHelper {
  static getUsingApplications(volume, applications) {
    return _.filter(applications, (app) => {
      const names = _.map(app.Volumes, 'name');
      return _.includes(names, volume.PersistentVolumeClaim.Name)
    });
  }
}

export default KubernetesVolumeHelper;
