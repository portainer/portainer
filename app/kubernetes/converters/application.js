import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesApplication, KubernetesApplicationPersistedFolder, KubernetesApplicationConfigurationVolume, KubernetesPortainerApplicationStackNameLabel, KubernetesApplicationDeploymentTypes, KubernetesApplicationDataAccessPolicies, KubernetesApplicationTypes, KubernetesPortainerApplicationOwnerLabel } from 'Kubernetes/models/application/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';

class KubernetesApplicationConverter {
  static applicationCommon(res, data, service) {
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.StackName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationStackNameLabel] || '-' : '-';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] : '';
    res.ResourcePool = data.metadata.namespace;
    res.Image = data.spec.template.spec.containers[0].image;
    res.CreationDate = data.metadata.creationTimestamp;
    res.Pods = data.Pods;
    res.Env = data.spec.template.spec.containers[0].env;
    const limits = {
      Cpu: 0,
      Memory: 0
    };
    res.Limits = _.reduce(data.spec.template.spec.containers, (acc, item) => {
      if (item.resources.limits && item.resources.limits.cpu) {
        acc.Cpu += KubernetesResourceReservationHelper.parseCPU(item.resources.limits.cpu);
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

    const persistedFolders = _.filter(res.Volumes, (volume) => {
      return volume.persistentVolumeClaim || volume.hostPath;
    });

    res.PersistedFolders = _.map(persistedFolders, (volume) => {
      const matchingVolumeMount = _.find(data.spec.template.spec.containers[0].volumeMounts, { name: volume.name });

      if (matchingVolumeMount) {
        const persistedFolder = new KubernetesApplicationPersistedFolder();
        persistedFolder.mountPath = matchingVolumeMount.mountPath;

        if (volume.persistentVolumeClaim) {
          persistedFolder.persistentVolumeClaimName = volume.persistentVolumeClaim.claimName;
        } else {
          persistedFolder.hostPath = volume.hostPath.path;
        }

        return persistedFolder;
      }
    });

    res.ConfigurationVolumes = _.reduce(data.spec.template.spec.volumes, (acc, volume) => {
      if (volume.configMap || volume.secret) {
        const matchingVolumeMount = _.find(data.spec.template.spec.containers[0].volumeMounts, { name: volume.name });

        if (matchingVolumeMount) {
          let items = [];
          let configurationName = '';

          if (volume.configMap) {
            items = volume.configMap.items;
            configurationName = volume.configMap.name;
          } else {
            items = volume.secret.items;
            configurationName = volume.secret.secretName;
          }


          if (!items) {
            const configurationVolume = new KubernetesApplicationConfigurationVolume();
            configurationVolume.mountPath = matchingVolumeMount.mountPath;
            configurationVolume.configurationName = configurationName;
            acc.push(configurationVolume);
          } else {
            _.forEach(items, (item) => {
              const configurationVolume = new KubernetesApplicationConfigurationVolume();
              configurationVolume.mountPath = matchingVolumeMount.mountPath + '/' + item.path;
              configurationVolume.configurationKey = item.key;
              configurationVolume.configurationName = configurationName;

              acc.push(configurationVolume);
            });
          }
        }
      }

      return acc;
    }, []);
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
    res.HeadlessServiceName = data.spec.serviceName;
    return res;
  }
}

export default KubernetesApplicationConverter;
