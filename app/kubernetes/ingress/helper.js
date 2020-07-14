import * as _ from 'lodash-es';

export class KubernetesIngressHelper {
  static findSBoundServiceIngressesRules(ingressRules, service) {
    return _.filter(ingressRules, (r) => r.ServiceName === service.metadata.name);
  }
}
