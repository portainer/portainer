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

    const quota = KubernetesResourceQuotaConverter.resourcePoolFormValuesToResourceQuota(formValues);

    const ingMap = _.map(formValues.IngressClasses, (c) => {
      if (c.Selected) {
        c.Namespace = namespace.Name;
        return KubernetesIngressConverter.resourcePoolIngressClassFormValueToIngress(c);
      }
    });
    const ingresses = _.without(ingMap, undefined);
    return [namespace, quota, ingresses];
  }
}

export default KubernetesResourcePoolConverter;
