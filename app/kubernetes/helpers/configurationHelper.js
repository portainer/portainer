import _ from 'lodash-es';
import YAML from 'yaml';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import { KubernetesConfigurationFormValuesEntry } from 'Kubernetes/models/configuration/formvalues';

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

  static getApplicationConfigurations(applications, configurations) {
    const configurationsUsed = configurations.filter((config) => KubernetesConfigurationHelper.getUsingApplications(config, applications).length !== 0);
    // set the configurations used for each application in the list
    const configuredApps = applications.map((app) => {
      const configMappedByName = configurationsUsed.filter((config) => app.ApplicationName === config.Name && app.ResourcePool === config.Namespace);
      const configMappedByVolume = configurationsUsed
        .filter((config) => app.ConfigurationVolumes.some((cv) => cv.configurationName === config.Name))
        .filter((config) => !configMappedByName.some((c) => c.Name === config.Name)); // filter out duplicates that are mapped by name
      app.Configurations = [...configMappedByName, ...configMappedByVolume];
      return app;
    });
    return configuredApps;
  }

  static parseYaml(formValues) {
    YAML.defaultOptions.customTags = ['binary'];
    const data = _.map(YAML.parse(formValues.DataYaml), (value, key) => {
      const entry = new KubernetesConfigurationFormValuesEntry();
      entry.Key = key;
      entry.Value = value;
      const oldEntry = _.find(formValues.Data, { Key: entry.Key });
      entry.IsBinary = oldEntry ? oldEntry.IsBinary : false;
      return entry;
    });
    return data;
  }

  static parseData(formValues) {
    if (!formValues.Data.length) return '';

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
