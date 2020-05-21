import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

import {
  KubernetesApplication,
  KubernetesApplicationPersistedFolder,
  KubernetesApplicationConfigurationVolume,
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationTypes,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationNote,
  KubernetesApplicationPublishingTypes,
  KubernetesPortainerApplicationNameLabel
} from 'Kubernetes/models/application/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesApplicationFormValues } from 'Kubernetes/models/application/formValues';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

import KubernetesDeploymentConverter from 'Kubernetes/converters/deployment';
import KubernetesDaemonSetConverter from 'Kubernetes/converters/daemonSet';
import KubernetesStatefulSetConverter from 'Kubernetes/converters/statefulSet';
import KubernetesServiceConverter from 'Kubernetes/converters/service';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import PortainerError from 'Portainer/error';

class KubernetesApplicationConverter {
  static applicationCommon(res, data, service) {
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.StackName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationStackNameLabel] || '-' : '-';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] || '' : '';
    res.Note = data.metadata.annotations ? data.metadata.annotations[KubernetesPortainerApplicationNote] || '' : '';
    res.ApplicationName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationNameLabel] || res.Name : res.Name;
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
        acc.Memory += filesizeParser(item.resources.limits.memory, { base: 10 });
      }
      return acc;
    }, limits);

    if (service) {
      const serviceType = service.spec.type;
      res.ServiceType = serviceType;
      res.ServiceId = service.metadata.uid;
      res.ServiceName = service.metadata.name;

      if (serviceType === KubernetesServiceTypes.LOAD_BALANCER) {
        if (service.status.loadBalancer.ingress && service.status.loadBalancer.ingress.length > 0) {
          res.LoadBalancerIPAddress = service.status.loadBalancer.ingress[0].ip || service.status.loadBalancer.ingress[0].hostname;
        }
      }
      res.PublishedPorts = service.spec.ports;
    }

    res.Volumes = data.spec.template.spec.volumes ? data.spec.template.spec.volumes : [];

    const persistedFolders = _.filter(res.Volumes, (volume) => volume.persistentVolumeClaim || volume.hostPath);

    res.PersistedFolders = _.map(persistedFolders, (volume) => {
      const matchingVolumeMount = _.find(data.spec.template.spec.containers[0].volumeMounts, { name: volume.name });

      if (matchingVolumeMount) {
        const persistedFolder = new KubernetesApplicationPersistedFolder();
        persistedFolder.MountPath = matchingVolumeMount.mountPath;

        if (volume.persistentVolumeClaim) {
          persistedFolder.PersistentVolumeClaimName = volume.persistentVolumeClaim.claimName;
        } else {
          persistedFolder.HostPath = volume.hostPath.path;
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
            configurationVolume.fileMountPath = matchingVolumeMount.mountPath;
            configurationVolume.rootMountPath = matchingVolumeMount.mountPath;
            configurationVolume.configurationName = configurationName;

            acc.push(configurationVolume);
          } else {
            _.forEach(items, (item) => {
              const configurationVolume = new KubernetesApplicationConfigurationVolume();
              configurationVolume.fileMountPath = matchingVolumeMount.mountPath + '/' + item.path;
              configurationVolume.rootMountPath = matchingVolumeMount.mountPath;
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
    res.TotalPodsCount = data.spec.replicas;
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
    res.RunningPodsCount = data.status.readyReplicas || 0;
    res.TotalPodsCount = data.spec.replicas;
    res.HeadlessServiceName = data.spec.serviceName;
    return res;
  }

  static applicationToFormValues(app, resourcePools, configurations, persistentVolumeClaims) {
    const res = new KubernetesApplicationFormValues();
    res.ApplicationType = app.ApplicationType;
    res.ResourcePool = _.find(resourcePools, ['Namespace.Name', app.ResourcePool]);
    res.Name = app.Name;
    res.StackName = app.StackName;
    res.ApplicationOwner = app.ApplicationOwner;
    res.Image = app.Image;
    res.ReplicaCount = app.TotalPodsCount;
    res.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(app.Limits.Memory);
    res.CpuLimit = app.Limits.Cpu;
    res.DeploymentType = app.DeploymentType;
    res.DataAccessPolicy = app.DataAccessPolicy;
    res.EnvironmentVariables = KubernetesApplicationHelper.generateEnvVariablesFromEnv(app.Env);
    res.PersistedFolders = KubernetesApplicationHelper.generatePersistedFoldersFormValuesFromPersistedFolders(app.PersistedFolders, persistentVolumeClaims); // generate from PVC and app.PersistedFolders
    res.Configurations = KubernetesApplicationHelper.generateConfigurationFormValuesFromEnvAndVolumes(app.Env, app.ConfigurationVolumes, configurations);

    if (app.ServiceType === KubernetesServiceTypes.LOAD_BALANCER) {
      res.PublishingType = KubernetesApplicationPublishingTypes.LOAD_BALANCER;
    } else if (app.ServiceType === KubernetesServiceTypes.NODE_PORT) {
      res.PublishingType = KubernetesApplicationPublishingTypes.CLUSTER;
    } else {
      res.PublishingType = KubernetesApplicationPublishingTypes.INTERNAL;
    }
    res.PublishedPorts = KubernetesApplicationHelper.generatePublishedPortsFormValuesFromPublishedPorts(app.ServiceType, app.PublishedPorts);
    return res;
  }

  static applicationFormValuesToApplication(formValues) {
    const claims = KubernetesPersistentVolumeClaimConverter.applicationFormValuesToVolumeClaims(formValues);
    const roxrwx = _.find(claims, (item) => _.includes(item.StorageClass.AccessModes, 'ROX') || _.includes(item.StorageClass.AccessModes, 'RWX')) !== undefined;

    const deployment = (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED &&
      (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED)))
      || (formValues.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT);

    const statefulSet = (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED &&
      claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.ISOLATED)
      || (formValues.ApplicationType === KubernetesApplicationTypes.STATEFULSET);

    const daemonSet = (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.GLOBAL &&
      (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED && roxrwx)))
      || (formValues.ApplicationType === KubernetesApplicationTypes.DAEMONSET);

    let app;
    if (deployment) {
      app = KubernetesDeploymentConverter.applicationFormValuesToDeployment(formValues, claims);
    } else if (statefulSet) {
      app = KubernetesStatefulSetConverter.applicationFormValuesToStatefulSet(formValues, claims);
    } else if (daemonSet) {
      app = KubernetesDaemonSetConverter.applicationFormValuesToDaemonSet(formValues, claims);
    } else {
      throw new PortainerError('Unable to determine which association to use');
    }

    let headlessService;
    if (statefulSet) {
      headlessService = KubernetesServiceConverter.applicationFormValuesToHeadlessService(formValues);
    }

    let service = KubernetesServiceConverter.applicationFormValuesToService(formValues);
    if (!service.Ports.length) {
      service = undefined;
    }
    return [app, headlessService, service, claims];
  }
}

export default KubernetesApplicationConverter;
