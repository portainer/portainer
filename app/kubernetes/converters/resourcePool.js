import _ from 'lodash-es';

import { KubernetesResourcePool } from 'Kubernetes/models/resource-pool/models';
import { KubernetesNamespace } from 'Kubernetes/models/namespace/models';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import KubernetesResourceQuotaConverter from './resourceQuota';

class KubernetesResourcePoolConverter {
  static apiToResourcePool(namespace) {
    const res = new KubernetesResourcePool();
    res.Namespace = namespace;
    res.Yaml = namespace.Yaml;
    return res;
  }

  static formValuesToResourcePool(formValues) {
    const namespace = new KubernetesNamespace();
    namespace.Name = formValues.Name;
    namespace.ResourcePoolName = formValues.Name;
    namespace.ResourcePoolOwner = formValues.Owner;
    namespace.IsSystem = formValues.IsSystem;

    const quota = KubernetesResourceQuotaConverter.resourcePoolFormValuesToResourceQuota(formValues);

    const ingMap = _.map(formValues.IngressClasses, (c) => {
      if (c.Selected) {
        c.Namespace = namespace.Name;
        return KubernetesIngressConverter.resourcePoolIngressClassFormValueToIngress(c);
      }
    });
    const ingresses = _.without(ingMap, undefined);
    const registries = _.map(formValues.Registries, (r) => {
      if (!r.RegistryAccesses[formValues.EndpointId]) {
        r.RegistryAccesses[formValues.EndpointId] = { Namespaces: [] };
      }
      if (!_.includes(r.RegistryAccesses[formValues.EndpointId].Namespaces, formValues.Name)) {
        r.RegistryAccesses[formValues.EndpointId].Namespaces = [...r.RegistryAccesses[formValues.EndpointId].Namespaces, formValues.Name];
      }
      return r;
    });
    return [namespace, quota, ingresses, registries];
  }
}

export default KubernetesResourcePoolConverter;
