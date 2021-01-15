import { KubernetesConfigurationTypes, KubernetesConfigurationEntry } from 'Kubernetes/models/configuration/models';
import _ from 'lodash-es';
import YAML from 'yaml';

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

  static isSystemToken(config) {
    return _.startsWith(config.Name, 'default-token-');
  }

  static isBinary(encoding) {
    return encoding !== '' && !_.includes(encoding, 'ISO') && !_.includes(encoding, 'UTF');
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

  static parseYaml(formValues) {
    YAML.defaultOptions.customTags = ['binary'];
    const data = _.map(YAML.parse(formValues.DataYaml), (value, key) => {
      const entry = new KubernetesConfigurationEntry();
      entry.Key = key;
      entry.Value = value;
      const oldEntry = _.find(formValues.Data, { Key: entry.Key });
      entry.IsBinary = oldEntry ? oldEntry.IsBinary : false;
      return entry;
    });
    return data;
  }

  static parseData(formValues) {
    const data = _.reduce(
      formValues.Data,
      (acc, entry) => {
        acc[entry.Key] = entry.Value;
        return acc;
      },
      {}
    );
    return YAML.stringify(data);
  }

  static isExternalConfiguration(configuration) {
    return !configuration.ConfigurationOwner;
  }
}

export default KubernetesConfigurationHelper;
