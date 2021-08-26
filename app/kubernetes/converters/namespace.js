import _ from 'lodash-es';
import { KubernetesNamespace } from 'Kubernetes/models/namespace/models';
import { KubernetesNamespaceCreatePayload } from 'Kubernetes/models/namespace/payloads';
import {
  KubernetesPortainerResourcePoolNameLabel,
  KubernetesPortainerResourcePoolOwnerLabel,
  KubernetesPortainerNamespaceSystemLabel,
} from 'Kubernetes/models/resource-pool/models';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

export default class KubernetesNamespaceConverter {
  static apiToNamespace(data, yaml) {
    const res = new KubernetesNamespace();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.CreationDate = data.metadata.creationTimestamp;
    res.Status = data.status.phase;
    res.Yaml = yaml ? yaml.data : '';
    res.ResourcePoolName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolNameLabel] : '';
    res.ResourcePoolOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] : '';

    res.IsSystem = KubernetesNamespaceHelper.isDefaultSystemNamespace(data.metadata.name);
    if (data.metadata.labels) {
      const systemLabel = data.metadata.labels[KubernetesPortainerNamespaceSystemLabel];
      if (!_.isEmpty(systemLabel)) {
        res.IsSystem = systemLabel === 'true';
      }
    }
    return res;
  }

  static createPayload(namespace) {
    const res = new KubernetesNamespaceCreatePayload();
    res.metadata.name = namespace.Name;
    res.metadata.labels[KubernetesPortainerResourcePoolNameLabel] = namespace.ResourcePoolName;

    if (namespace.ResourcePoolOwner) {
      const resourcePoolOwner = _.truncate(namespace.ResourcePoolOwner, { length: 63, omission: '' });
      res.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] = resourcePoolOwner;
    }
    return res;
  }
}
