import * as _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesApplicationPublishingTypes } from 'Kubernetes/models/application/models';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { KubernetesIngressRule, KubernetesIngress } from './models';
import { KubernetesIngressCreatePayload, KubernetesIngressRuleCreatePayload, KubernetesIngressRulePathCreatePayload } from './payloads';
import { KubernetesIngressClassAnnotation } from './constants';

export class KubernetesIngressConverter {
  static apiToModel(data) {
    const rules = _.flatMap(data.spec.rules, (rule) => {
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
    res.IngressClassName =
      data.metadata.annotations && data.metadata.annotations[KubernetesIngressClassAnnotation]
        ? data.metadata.annotations[KubernetesIngressClassAnnotation]
        : data.spec.ingressClassName;
    res.Rules = rules;
    return res;
  }

  // REFACTOR
  static applicationFormValuesToIngresses(formValues, service) {
    const ingresses = angular.copy(formValues.OriginalIngresses);
    _.forEach(formValues.PublishedPorts, (p) => {
      console.log(p)
      const ingress = _.find(ingresses, { Name: p.IngressName });
      if (ingress && p.NeedsDeletion) {
        const rule = _.find(ingress.Rules, { Port: p.ContainerPort, ServiceName: service.Name, Path: p.IngressRoute });
        _.remove(ingress.Rules, rule);
      } else if (ingress && p.IsNew) {
        const rule = new KubernetesIngressRule();
        rule.ParentIngressName = ingress.Name;
        rule.ServiceName = service.Name;
        rule.Port = p.ContainerPort;
        rule.Path = p.IngressRoute;
        ingress.Rules.push(rule);
      }
    })
    return ingresses;
  }
  // static applicationFormValuesToIngresses(formValues, service) {
  //   let ingresses = [];
  //   if (formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS && service) {
  //     ingresses = _.map(formValues.PublishedPorts, (publishedPort) => {
  //       let rule = _.find(publishedPort.Ingress.Rules, { ServiceName: service.Name, Port: publishedPort.ContainerPort });
  //       const exists = rule !== undefined;
  //       if (!exists) {
  //         rule = new KubernetesIngressRule();
  //       }
  //       rule.ParentIngressName = publishedPort.Ingress.Name;
  //       rule.ServiceName = service.Name;
  //       rule.Port = publishedPort.ContainerPort;
  //       rule.Path = publishedPort.IngressRoute;
  //       if (!exists) {
  //         publishedPort.Ingress.Rules.push(rule);
  //       }
  //       return publishedPort.Ingress;
  //     });
  //     ingresses = _.uniq(ingresses);
  //   }
  //   return ingresses;
  // }

  static createPayload(data) {
    const res = new KubernetesIngressCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.metadata.annotations[KubernetesIngressClassAnnotation] = data.IngressClassName;
    const groups = _.groupBy(data.Rules, 'Host');
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
