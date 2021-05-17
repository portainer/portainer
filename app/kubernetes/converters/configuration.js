import _ from 'lodash-es';
import { KubernetesConfiguration, KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

class KubernetesConfigurationConverter {
  static secretToConfiguration(secret) {
    const res = new KubernetesConfiguration();
    res.Type = KubernetesConfigurationTypes.SECRET;
    res.Id = secret.Id;
    res.Name = secret.Name;
    res.Namespace = secret.Namespace;
    res.CreationDate = secret.CreationDate;
    res.Yaml = secret.Yaml;
    _.forEach(secret.Data, (entry) => {
      res.Data[entry.Key] = entry.Value;
    });
    res.ConfigurationOwner = secret.ConfigurationOwner;
    res.IsRegistrySecret = secret.IsRegistrySecret;
    return res;
  }

  static configMapToConfiguration(configMap) {
    const res = new KubernetesConfiguration();
    res.Type = KubernetesConfigurationTypes.CONFIGMAP;
    res.Id = configMap.Id;
    res.Name = configMap.Name;
    res.Namespace = configMap.Namespace;
    res.CreationDate = configMap.CreationDate;
    res.Yaml = configMap.Yaml;
    _.forEach(configMap.Data, (entry) => {
      res.Data[entry.Key] = entry.Value;
    });
    res.ConfigurationOwner = configMap.ConfigurationOwner;
    return res;
  }
}

export default KubernetesConfigurationConverter;
