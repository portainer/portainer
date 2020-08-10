import * as _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { KubernetesIngressRule, KubernetesIngress } from './models';
import { KubernetesIngressCreatePayload, KubernetesIngressRuleCreatePayload, KubernetesIngressRulePathCreatePayload } from './payloads';
import { KubernetesIngressClassAnnotation, KubernetesIngressClassMandatoryAnnotations } from './constants';

export class KubernetesIngressConverter {
  static apiToModel(data) {
    const paths = _.flatMap(data.spec.rules, (rule) => {
      return _.map(rule.http.paths, (path) => {
        const ingRule = new KubernetesIngressRule();
        ingRule.ParentIngressName = data.metadata.name;
        ingRule.ServiceName = path.backend.serviceName;
        ingRule.Host = rule.host || '';
        ingRule.IP = data.status.loadBalancer.ingress ? data.status.loadBalancer.ingress[0].ip : undefined;
        ingRule.Port = path.backend.servicePort;
        ingRule.Path = path.path;
        return ingRule;
      });
    });

    const res = new KubernetesIngress();
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.Annotations = data.metadata.annotations || {};
    res.Paths = paths;
    return res;
  }

  static applicationFormValuesToIngresses(formValues, serviceName) {
    const ingresses = angular.copy(formValues.OriginalIngresses);
    _.forEach(formValues.PublishedPorts, (p) => {
      const ingress = _.find(ingresses, { Name: p.IngressName });
      if (ingress && p.NeedsDeletion) {
        const path = _.find(ingress.Paths, { Port: p.ContainerPort, ServiceName: serviceName, Path: p.IngressRoute });
        _.remove(ingress.Paths, path);
      } else if (ingress && p.IsNew) {
        const rule = new KubernetesIngressRule();
        rule.ParentIngressName = ingress.Name;
        rule.ServiceName = serviceName;
        rule.Port = p.ContainerPort;
        rule.Path = p.IngressRoute;
        ingress.Paths.push(rule);
      }
    });
    return ingresses;
  }

  static createPayload(data) {
    const res = new KubernetesIngressCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.metadata.annotations = data.Annotations || {};
    res.metadata.annotations[KubernetesIngressClassAnnotation] = data.Name;
    const annotations = KubernetesIngressClassMandatoryAnnotations[data.Name];
    if (annotations) {
      _.extend(res.metadata.annotations, annotations);
    }
    const groups = _.groupBy(data.Paths, 'Host');
    const rules = _.map(groups, (rules, host) => {
      const rule = new KubernetesIngressRuleCreatePayload();

      KubernetesCommonHelper.assignOrDeleteIfEmpty(rule, 'host', host);
      rule.http.paths = _.map(rules, (r) => {
        const path = new KubernetesIngressRulePathCreatePayload();
        path.path = r.Path;
        path.backend.serviceName = r.ServiceName;
        path.backend.servicePort = r.Port;
        return path;
      });
      return rule;
    });
    KubernetesCommonHelper.assignOrDeleteIfEmpty(res, 'spec.rules', rules);

    return res;
  }

  static patchPayload(oldData, newData) {
    const oldPayload = KubernetesIngressConverter.createPayload(oldData);
    const newPayload = KubernetesIngressConverter.createPayload(newData);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}
