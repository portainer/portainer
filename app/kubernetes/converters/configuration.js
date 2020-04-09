import {KubernetesConfiguration, KubernetesConfigurationTypes} from 'Kubernetes/models/configuration/models';

class KubernetesConfigurationConverter {

  static secretToConfiguration(secret) {
    const res = new KubernetesConfiguration();
    res.Type = KubernetesConfigurationTypes.SECRET;
    res.Id = secret.Id;
    res.Name = secret.Name;
    res.Namespace = secret.Namespace;
    res.CreationDate = secret.CreationDate;
    res.Yaml = secret.Yaml;
    res.Data = secret.Data;
    res.ConfigurationOwner = secret.ConfigurationOwner;
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
    res.Data = configMap.Data;
    res.ConfigurationOwner = configMap.ConfigurationOwner;
    return res;
  }
}

export default KubernetesConfigurationConverter;
