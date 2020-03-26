import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import _ from 'lodash-es';

class KubernetesConfigurationHelper {
  static getUsingApplications(config, applications) {
    return _.filter(applications, (app) => {
      let envFind;
      let volumeFind;
      if (config.Type === KubernetesConfigurationTypes.CONFIGMAP) {
        envFind = _.find(app.Env, { valueFrom: { configMapKeyRef: { name: config.Name } } });
        volumeFind = _.find(app.Volumes, { configMap: { name: config.Name } });
      } else {
        envFind = _.find(app.Env, { valueFrom: { secretKeyRef: { name: config.Name } } });
        volumeFind = _.find(app.Volumes, { secret: { secretName: config.Name } });
      }
      return envFind || volumeFind;
    });
  }

  static setConfigurationUsed(config) {
    config.Used = config.Applications && config.Applications.length !== 0;
  }

  static setConfigurationsUsed(configurations, applications) {
    _.forEach(configurations, (config) => {
      config.Applications = KubernetesConfigurationHelper.getUsingApplications(config, applications);
      KubernetesConfigurationHelper.setConfigurationUsed(config);
    });
  }
}

export default KubernetesConfigurationHelper;