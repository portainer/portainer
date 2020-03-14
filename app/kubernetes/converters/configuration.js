import {KubernetesConfiguration, KubernetesConfigurationTypes} from 'Kubernetes/models/configuration/models';

class KubernetesConfigurationConverter {

  static secretToConfiguration(secret) {
    const res = new KubernetesConfiguration();
    res.Type = KubernetesConfigurationTypes.SECRET;
    res.Name = secret.Name;
    res.Namespace = secret.Namespace;
    res.CreationDate = secret.CreationDate;
    res.Data = secret.Data;
    return res;
  }

  static configMapToConfiguration(configMap) {
    const res = new KubernetesConfiguration();
    res.Type = KubernetesConfigurationTypes.BASIC;
    res.Id = configMap.Id;
    res.Name = configMap.Name;
    res.Namespace = configMap.Namespace;
    res.CreationDate = configMap.CreationDate;
    res.Data = configMap.Data;
    return res;
  }
}

export default KubernetesConfigurationConverter;
