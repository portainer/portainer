import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';
import { KubernetesNamespace, KUBERNETES_SYSTEM_NAMESPACES } from 'Kubernetes/models/namespace/models';
import { KubernetesNamespaceCreatePayload } from 'Kubernetes/models/namespace/payloads';
import { KubernetesPortainerResourcePoolNameLabel, KubernetesPortainerResourcePoolOwnerLabel, KubernetesPortainerNamespaceSystem } from 'Kubernetes/models/resource-pool/models';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';

class KubernetesNamespaceConverter {
  static apiToNamespace(data, yaml) {
    const res = new KubernetesNamespace();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.CreationDate = data.metadata.creationTimestamp;
    res.Status = data.status.phase;
    res.Yaml = yaml ? yaml.data : '';
    res.ResourcePoolName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolNameLabel] : '';
    res.ResourcePoolOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] : '';
    res.NamespaceSystemLabel = data.metadata.labels ? data.metadata.labels[KubernetesPortainerNamespaceSystem] : undefined;

    res.IsSystem = false;
    const isDefaultKubeSystem = _.includes(KUBERNETES_SYSTEM_NAMESPACES, data.metadata.name);
    if (data.metadata.labels) {
      const systemLabel = data.metadata.labels[KubernetesPortainerNamespaceSystem];
      if (_.isEmpty(systemLabel)) {
        res.IsSystem = isDefaultKubeSystem;
      } else {
        res.IsSystem = systemLabel === 'true';
      }
    } else {
      res.IsSystem = isDefaultKubeSystem;
    }
    return res;
  }

  static createPayload(namespace) {
    const res = new KubernetesNamespaceCreatePayload();
    res.metadata.name = namespace.Name;
    res.metadata.labels[KubernetesPortainerResourcePoolNameLabel] = namespace.ResourcePoolName;
    KubernetesCommonHelper.assignOrDeleteIfEmpty(res, `metadata.labels['${KubernetesPortainerNamespaceSystem}']`, namespace.IsSystem.toString());
    if (namespace.NamespaceSystemLabel === undefined && namespace.IsSystem === true) {
      delete res.metadata.labels[KubernetesPortainerNamespaceSystem];
    }

    if (namespace.ResourcePoolOwner) {
      const resourcePoolOwner = _.truncate(namespace.ResourcePoolOwner, { length: 63, omission: '' });
      res.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] = resourcePoolOwner;
    }
    return res;
  }

  static patchPayload(oldNamespace, newNamespace) {
    const oldPayload = KubernetesNamespaceConverter.createPayload(oldNamespace);
    const newPayload = KubernetesNamespaceConverter.createPayload(newNamespace);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesNamespaceConverter;
