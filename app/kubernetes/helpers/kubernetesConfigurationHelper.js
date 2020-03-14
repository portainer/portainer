import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import _ from 'lodash-es';

class KubernetesConfigurationHelper {
  static setConfigurationUsed(config, apps) {
    _.forEach(apps, (app) => {
      const configMapFind = _.find(app.Volumes, (vol) => vol.configMap && vol.configMap.name === config.Name);
      if ((config.Type === KubernetesConfigurationTypes.SECRET && app.Name === config.Name) || configMapFind !== undefined) {
        config.Used = true;
        config.Apps.push(app);
      }
    })
    return config;
  }
  
  static setConfigurationsUsed(configs, apps) {
    _.forEach(configs, (config) => {
      return KubernetesConfigurationHelper.setConfigurationUsed(config, apps);
    });
  }
}

export default KubernetesConfigurationHelper;