import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import {
  KubernetesResourcePoolIngressClassAnnotationFormValue,
  KubernetesResourcePoolIngressClassFormValue,
  KubernetesResourcePoolIngressClassHostFormValue,
} from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngress, KubernetesIngressRule } from './models';
import { KubernetesIngressCreatePayload, KubernetesIngressRuleCreatePayload, KubernetesIngressRulePathCreatePayload } from './payloads';
import { KubernetesIngressClassAnnotation, KubernetesIngressClassRewriteTargetAnnotations } from './constants';

export class KubernetesIngressConverter {
  static apiToModel(data) {
    const paths = _.flatMap(data.spec.rules, (rule) => {
      return !rule.http
        ? []
        : _.map(rule.http.paths, (path) => {
            const ingRule = new KubernetesIngressRule();
            ingRule.IngressName = data.metadata.name;
            ingRule.ServiceName = path.backend.service.name;
            ingRule.Host = rule.host || '';
            ingRule.IP = data.status.loadBalancer.ingress ? data.status.loadBalancer.ingress[0].ip : undefined;
            ingRule.Port = path.backend.service.port.number;
            ingRule.Path = path.path;
            return ingRule;
          });
    });

    const res = new KubernetesIngress();
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.Annotations = data.metadata.annotations || {};
    res.IngressClassName =
      data.metadata.annotations && data.metadata.annotations[KubernetesIngressClassAnnotation]
        ? data.metadata.annotations[KubernetesIngressClassAnnotation]
        : data.spec.ingressClassName;
    res.Paths = paths;
    res.Hosts = _.uniq(_.map(data.spec.rules, 'host'));
    const idx = _.findIndex(res.Hosts, (h) => h === undefined);
    if (idx >= 0) {
      res.Hosts.splice(idx, 1, '');
    }
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
        rule.IngressName = ingress.Name;
        rule.ServiceName = serviceName;
        rule.Port = p.ContainerPort;
        if (p.IngressRoute) {
          rule.Path = _.startsWith(p.IngressRoute, '/') ? p.IngressRoute : '/' + p.IngressRoute;
        }
        rule.Host = p.IngressHost;
        ingress.Paths.push(rule);
      }
    });
    return ingresses;
  }

  /**
   *
   * @param {KubernetesResourcePoolIngressClassFormValue} formValues
   */
  static resourcePoolIngressClassFormValueToIngress(formValues) {
    const res = new KubernetesIngress();
    res.Name = formValues.IngressClass.Name;
    res.Namespace = formValues.Namespace;
    const pairs = _.map(formValues.Annotations, (a) => [a.Key, a.Value]);
    res.Annotations = _.fromPairs(pairs);
    if (formValues.RewriteTarget) {
      _.extend(res.Annotations, KubernetesIngressClassRewriteTargetAnnotations[formValues.IngressClass.Type]);
    }
    res.Annotations[KubernetesIngressClassAnnotation] = formValues.IngressClass.Name;
    res.Hosts = formValues.Hosts;
    res.Paths = formValues.Paths;
    return res;
  }

  /**
   *
   * @param {KubernetesIngressClass} ics Ingress classes (saved in Portainer DB)
   * @param {KubernetesIngress[]} ingresses Existing Kubernetes ingresses. Must be empty for RP CREATE VIEW and filled for RP EDIT VIEW
   */
  static ingressClassesToFormValues(ics, ingresses) {
    const res = _.map(ics, (ic) => {
      const fv = new KubernetesResourcePoolIngressClassFormValue(ic);
      const ingress = _.find(ingresses, { Name: ic.Name });
      if (ingress) {
        fv.Selected = true;
        fv.WasSelected = true;
        fv.Hosts = _.map(ingress.Hosts, (host) => {
          const hfv = new KubernetesResourcePoolIngressClassHostFormValue();
          hfv.Host = host;
          hfv.PreviousHost = host;
          hfv.IsNew = false;
          return hfv;
        });
        const [[rewriteKey]] = _.toPairs(KubernetesIngressClassRewriteTargetAnnotations[ic.Type]);
        const annotations = _.map(_.toPairs(ingress.Annotations), ([key, value]) => {
          if (key === rewriteKey) {
            fv.RewriteTarget = true;
          } else if (key !== KubernetesIngressClassAnnotation) {
            const annotation = new KubernetesResourcePoolIngressClassAnnotationFormValue();
            annotation.Key = key;
            annotation.Value = value;
            return annotation;
          }
        });
        fv.Annotations = _.without(annotations, undefined);
        fv.AdvancedConfig = fv.Annotations.length > 0;
        fv.Paths = ingress.Paths;
      }
      return fv;
    });
    return res;
  }

  static createPayload(data) {
    const res = new KubernetesIngressCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.metadata.annotations = data.Annotations;
    if (data.Paths && data.Paths.length) {
      _.forEach(data.Paths, (p) => {
        if (p.Host === 'undefined' || p.Host === undefined) {
          p.Host = '';
        }
      });
      const hostsWithRules = [];
      const groups = _.groupBy(data.Paths, 'Host');
      let rules = _.map(groups, (paths, host) => {
        const updatedHost = _.find(data.Hosts, (h) => {
          return h === host || h.PreviousHost === host;
        });
        host = updatedHost.Host || updatedHost;
        if (updatedHost.NeedsDeletion) {
          return;
        }
        const rule = new KubernetesIngressRuleCreatePayload();
        KubernetesCommonHelper.assignOrDeleteIfEmpty(rule, 'host', host);
        rule.http.paths = _.map(paths, (p) => {
          const path = new KubernetesIngressRulePathCreatePayload();
          path.path = p.Path;
          path.backend.service.name = p.ServiceName;
          path.backend.service.port.number = p.Port;
          return path;
        });
        hostsWithRules.push(host);
        return rule;
      });
      rules = _.without(rules, undefined);
      const keptHosts = _.without(
        _.map(data.Hosts, (h) => (h.NeedsDeletion ? undefined : h.Host || h)),
        undefined
      );
      const hostsWithoutRules = _.without(keptHosts, ...hostsWithRules);
      const emptyRules = _.map(hostsWithoutRules, (host) => {
        return { host: host };
      });
      rules = _.concat(rules, emptyRules);
      KubernetesCommonHelper.assignOrDeleteIfEmpty(res, 'spec.rules', rules);
    } else if (data.Hosts) {
      res.spec.rules = [];
      _.forEach(data.Hosts, (host) => {
        if (!host.NeedsDeletion) {
          res.spec.rules.push({ host: host.Host || host });
        }
      });
    } else {
      delete res.spec.rules;
    }
    return res;
  }

  static patchPayload(oldData, newData) {
    const oldPayload = KubernetesIngressConverter.createPayload(oldData);
    const newPayload = KubernetesIngressConverter.createPayload(newData);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}
