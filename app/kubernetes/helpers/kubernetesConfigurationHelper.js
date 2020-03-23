import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import _ from 'lodash-es';

class KubernetesConfigurationHelper {
  static setConfigurationUsed(config, apps) {
    _.forEach(apps, (app) => {
      let envFind = false;
      let volumeFind = false;
      if (config.Type === KubernetesConfigurationTypes.BASIC) {
        envFind = _.find(app.Env, { valueFrom: { configMapKeyRef: { name: config.Name }}});
        volumeFind = _.find(app.Volumes, { configMap: { name: config.Name }});
      } else {
        envFind = _.find(app.Env, { valueFrom: { secretKeyRef: { name: config.Name }}});
        volumeFind = _.find(app.Volumes, { secret: { secretName: config.Name }});
      }
      if (envFind || volumeFind) {
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