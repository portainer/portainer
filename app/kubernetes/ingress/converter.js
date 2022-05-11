import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import {
  KubernetesResourcePoolIngressClassAnnotationFormValue,
  KubernetesResourcePoolIngressClassFormValue,
  KubernetesResourcePoolIngressClassHostFormValue,
} from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesApplicationPublishingTypes } from '../models/application/models';
import { KubernetesIngress, KubernetesIngressRule } from './models';
import { KubernetesIngressCreatePayload, KubernetesIngressRuleCreatePayload, KubernetesIngressRulePathCreatePayload } from './payloads';
import { KubernetesIngressClassAnnotation, PortainerIngressClassTypes } from './constants';

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

  /**
   * Converts Application Form Value (from Create Application View) to Ingresses
   * @param {KubernetesApplicationFormValues} formValues
   * @param {string} serviceName
   * @returns {KubernetesIngressRule[]}
   */
  static applicationFormValuesToIngresses(formValues, serviceName) {
    const isPublishingToIngress = formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS;
    const ingresses = angular.copy(formValues.OriginalIngresses);
    _.forEach(formValues.PublishedPorts, (p) => {
      const ingress = _.find(ingresses, { Name: p.IngressName });
      if (ingress) {
        if (p.NeedsDeletion) {
          _.remove(ingress.Paths, (path) => path.Port === p.ContainerPort && path.ServiceName === serviceName && path.Path === p.IngressRoute);
        } else if (isPublishingToIngress && p.IsNew) {
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
      }
    });
    return ingresses;
  }

  static applicationFormValuesToDeleteIngresses(formValues, application) {
    const ingresses = angular.copy(formValues.OriginalIngresses);
    application.Services.forEach((service) => {
      ingresses.forEach((ingress) => {
        const path = _.find(ingress.Paths, { ServiceName: service.metadata.name });
        if (path) {
          _.remove(ingress.Paths, path);
        }
      });
    });
    return ingresses;
  }

  static removeIngressesPaths(ingresses, services) {
    const originalIngress = angular.copy(ingresses);
    originalIngress.forEach((ingress) => {
      services.forEach((service) => {
        _.remove(ingress.Paths, { ServiceName: service.Name });
      });
    });
    return originalIngress;
  }

  static generateNewIngresses(ingresses, services) {
    const originalIngresses = angular.copy(ingresses);
    services
      .filter((s) => s.Ingress)
      .forEach((service) => {
        if (service.Ports.length !== 0) {
          const matchedIngress = _.find(originalIngresses, { Name: service.Ports[0].ingress.IngressName });
          if (matchedIngress) {
            const rule = new KubernetesIngressRule();
            rule.ServiceName = service.Name;
            rule.IngressName = service.Ports[0].ingress.IngressName;
            rule.Host = service.Ports[0].ingress.Host;
            rule.Path = _.startsWith(service.Ports[0].ingress.Path, '/') ? service.Ports[0].ingress.Path : '/' + service.Ports[0].ingress.Path;
            rule.Port = service.Ports[0].port;

            matchedIngress.Paths.push(rule);
          }
        }
      });
    return originalIngresses;
  }

  // need this function for [ resource summary ] controller
  static newApplicationFormValuesToIngresses(formValues, serviceName, servicePorts) {
    const ingresses = angular.copy(formValues.OriginalIngresses);
    servicePorts.forEach((port) => {
      const ingress = _.find(ingresses, { Name: port.ingress.IngressName });
      if (ingress) {
        const rule = new KubernetesIngressRule();
        rule.ServiceName = serviceName;
        rule.IngressName = port.ingress.IngressName;
        rule.Host = port.ingress.Host;
        rule.Path = _.startsWith(port.ingress.Path, '/') ? port.ingress.Path : '/' + port.ingress.Path;
        rule.Port = port.port;

        ingress.Paths.push(rule);
      }
    });
    return ingresses;
  }

  /**
   *
   * @param {KubernetesResourcePoolIngressClassFormValue[]} formValues
   * @returns {KubernetesIngress} Ingress
   */
  static resourcePoolIngressClassFormValueToIngress(formValues) {
    const res = new KubernetesIngress();
    res.Name = formValues.IngressClass.Name;
    res.Namespace = formValues.Namespace;
    const pairs = _.map(formValues.Annotations, (a) => [a.Key, a.Value]);
    res.Annotations = _.fromPairs(pairs);
    res.Annotations[PortainerIngressClassTypes] = formValues.IngressClass.Name;
    res.IngressClassName = formValues.IngressClass.Name;
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
        const annotations = _.map(_.toPairs(ingress.Annotations), ([key, value]) => {
          if (key !== PortainerIngressClassTypes) {
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
    res.spec.ingressClassName = data.IngressClassName;
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
