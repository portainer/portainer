import * as _ from 'lodash-es';
import { KubernetesIngressRule } from './models';

export class KubernetesIngressConverter {
  static apiToModel(data) {
    const rules = _.flatMap(data.spec.rules, (rule) => {
      return _.map(rule.http.paths, (path) => {
        const ingRule = new KubernetesIngressRule();
        ingRule.ServiceName = path.backend.serviceName;
        ingRule.Host = rule.host;
        ingRule.IP = data.status.loadBalancer.ingress[0].ip;
        ingRule.Port = path.backend.servicePort;
        ingRule.Path = path.path;
        return ingRule;
      });
    });
    return rules;
  }
}
