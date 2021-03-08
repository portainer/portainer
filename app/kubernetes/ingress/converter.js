import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { KubernetesResourcePoolIngressClassAnnotationFormValue, KubernetesResourcePoolIngressClassFormValue } from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngress, KubernetesIngressRule } from './models';
import { KubernetesIngressCreatePayload, KubernetesIngressRuleCreatePayload, KubernetesIngressRulePathCreatePayload } from './payloads';
import { KubernetesIngressClassAnnotation, KubernetesIngressClassRewriteTargetAnnotations } from './constants';

export class KubernetesIngressConverter {
  // TODO: refactor @LP
  // currently only allows the first non-empty host to be used as the "configured" host.
  // As we currently only allow a single host to be used for a Portianer-managed ingress
  // it's working as the only non-empty host will be the one defined by the admin
  // but it will take a random existing host for non Portainer ingresses (CLI deployed)
  // Also won't support multiple hosts if we make it available in the future
  static apiToModel(data) {
    let host = undefined;
    const paths = _.flatMap(data.spec.rules, (rule) => {
      host = host || rule.host; // TODO: refactor @LP - read above
      return !rule.http
        ? []
        : _.map(rule.http.paths, (path) => {
            const ingRule = new KubernetesIngressRule();
            ingRule.IngressName = data.metadata.name;
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
    res.IngressClassName =
      data.metadata.annotations && data.metadata.annotations[KubernetesIngressClassAnnotation]
        ? data.metadata.annotations[KubernetesIngressClassAnnotation]
        : data.spec.ingressClassName;
    res.Paths = paths;
    res.Host = host;
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
        rule.Path = _.startsWith(p.IngressRoute, '/') ? p.IngressRoute : '/' + p.IngressRoute;
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
    res.Host = formValues.Host;
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
        fv.Host = ingress.Host;
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
      const groups = _.groupBy(data.Paths, 'Host');
      const rules = _.map(groups, (paths, host) => {
        const rule = new KubernetesIngressRuleCreatePayload();

        if (host === 'undefined' || _.isEmpty(host)) {
          host = data.Host;
        }
        if (host === data.PreviousHost && host !== data.Host) {
          host = data.Host;
        }
        KubernetesCommonHelper.assignOrDeleteIfEmpty(rule, 'host', host);
        rule.http.paths = _.map(paths, (p) => {
          const path = new KubernetesIngressRulePathCreatePayload();
          path.path = p.Path;
          path.backend.serviceName = p.ServiceName;
          path.backend.servicePort = p.Port;
          return path;
        });
        return rule;
      });
      KubernetesCommonHelper.assignOrDeleteIfEmpty(res, 'spec.rules', rules);
    } else if (data.Host) {
      res.spec.rules = [{ host: data.Host }];
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
