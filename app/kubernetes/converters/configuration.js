import _ from 'lodash-es';
import { KubernetesConfiguration, KubernetesConfigurationKinds } from '@/kubernetes/models/configuration/models';

class KubernetesConfigurationConverter {
  static secretToConfiguration(secret) {
    const res = new KubernetesConfiguration();
    res.Kind = KubernetesConfigurationKinds.SECRET;
    res.kind = 'Secret';
    res.Id = secret.Id;
    res.Name = secret.Name;
    res.Type = secret.Type;
    res.Namespace = secret.Namespace;
    res.CreationDate = secret.CreationDate;
    res.Yaml = secret.Yaml;
    _.forEach(secret.Data, (entry) => {
      res.Data[entry.Key] = entry.Value;
    });
    res.data = res.Data;
    res.ConfigurationOwner = secret.ConfigurationOwner;
    res.IsRegistrySecret = secret.IsRegistrySecret;
    res.SecretType = secret.SecretType;
    if (secret.Annotations) {
      const serviceAccountKey = 'kubernetes.io/service-account.name';
      if (typeof secret.Annotations === 'object') {
        res.ServiceAccountName = secret.Annotations[serviceAccountKey];
      } else if (Array.isArray(secret.Annotations)) {
        const serviceAccountAnnotation = secret.Annotations.find((a) => a.key === 'kubernetes.io/service-account.name');
        res.ServiceAccountName = serviceAccountAnnotation ? serviceAccountAnnotation.value : undefined;
      } else {
        res.ServiceAccountName = undefined;
      }
    }
    res.Annotations = secret.Annotations;
    res.Labels = secret.Labels;
    return res;
  }

  static configMapToConfiguration(configMap) {
    const res = new KubernetesConfiguration();
    res.Kind = KubernetesConfigurationKinds.CONFIGMAP;
    res.kind = 'ConfigMap';
    res.Id = configMap.Id;
    res.Name = configMap.Name;
    res.Namespace = configMap.Namespace;
    res.CreationDate = configMap.CreationDate;
    res.Yaml = configMap.Yaml;
    _.forEach(configMap.Data, (entry) => {
      res.Data[entry.Key] = entry.Value;
    });
    res.data = res.Data;
    res.ConfigurationOwner = configMap.ConfigurationOwner;
    res.Labels = configMap.Labels;
    return res;
  }
}

export default KubernetesConfigurationConverter;
