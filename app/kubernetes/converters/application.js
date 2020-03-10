import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesApplication, KubernetesPortainerApplicationStackNameLabel, KubernetesApplicationDeploymentTypes, KubernetesApplicationDataAccessPolicies, KubernetesApplicationTypes, KubernetesPortainerApplicationOwnerLabel } from 'Kubernetes/models/application/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';

class KubernetesApplicationConverter {
  static applicationCommon(res, data, service) {
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.StackName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationStackNameLabel] || '-' : '-';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] : '';
    res.ResourcePool = data.metadata.namespace;
    res.Image = data.spec.template.spec.containers[0].image;
    res.CreatedAt = data.metadata.creationTimestamp;
    res.Pods = data.Pods;
    const limits = {
      Cpu: 0,
      Memory: 0
    };
    res.Limits = _.reduce(data.spec.template.spec.containers, (acc, item) => {
      if (item.resources.limits && item.resources.limits.cpu) {
        acc.Cpu += parseInt(item.resources.limits.cpu);
        if (_.endsWith(item.resources.limits.cpu, 'm')) {
          acc.Cpu /= 1000;
        }
      }
      if (item.resources.limits && item.resources.limits.memory) {
        acc.Memory += filesizeParser(item.resources.limits.memory, {base: 10});
      }
      return acc;
    }, limits);
  
    if (service) {
      const serviceType = service.spec.type;
      res.ServiceType = serviceType;
      res.ServiceId = service.metadata.uid;
  
      if (serviceType === KubernetesServiceTypes.LOAD_BALANCER) {
        if (service.status.loadBalancer.ingress && service.status.loadBalancer.ingress.length > 0) {
          res.LoadBalancerIPAddress = service.status.loadBalancer.ingress[0].ip || service.status.loadBalancer.ingress[0].hostname;
        }
      }
  
      res.PublishedPorts = service.spec.ports;
    } else {
      res.PublishedPorts = [];
    }
    res.Volumes = data.spec.template.spec.volumes ? data.spec.template.spec.volumes : [];
  }

  static apiDeploymentToApplication(data, service) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, service);
    res.ApplicationType = KubernetesApplicationTypes.DEPLOYMENT;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.SHARED;
    res.RunningPodsCount = data.status.availableReplicas || data.status.replicas - data.status.unavailableReplicas || 0;
    res.TotalPodsCount = data.status.replicas || data.spec.replicas;
    return res;
  }

  static apiDaemonSetToApplication(data, service) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, service);
    res.ApplicationType = KubernetesApplicationTypes.DAEMONSET;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.GLOBAL;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.SHARED;
    res.RunningPodsCount = data.status.numberAvailable || data.status.desiredNumberScheduled - data.status.numberUnavailable || 0;
    res.TotalPodsCount = data.status.desiredNumberScheduled;
    return res;
  }

  static apiStatefulSetToapplication(data, service) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, service);
    res.ApplicationType = KubernetesApplicationTypes.STATEFULSET;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.ISOLATED;
    res.RunningPodsCount = data.status.replicas || 0;
    res.TotalPodsCount = data.spec.replicas;
    return res;
  }
}

export default KubernetesApplicationConverter;