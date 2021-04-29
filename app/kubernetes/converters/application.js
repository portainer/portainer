import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

import {
  KubernetesApplication,
  KubernetesApplicationConfigurationVolume,
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPersistedFolder,
  KubernetesApplicationPort,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationTypes,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationNote,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationStackNameLabel,
} from 'Kubernetes/models/application/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesApplicationFormValues } from 'Kubernetes/models/application/formValues';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';

import KubernetesDeploymentConverter from 'Kubernetes/converters/deployment';
import KubernetesDaemonSetConverter from 'Kubernetes/converters/daemonSet';
import KubernetesStatefulSetConverter from 'Kubernetes/converters/statefulSet';
import KubernetesServiceConverter from 'Kubernetes/converters/service';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import PortainerError from 'Portainer/error';
import { KubernetesIngressHelper } from 'Kubernetes/ingress/helper';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';

function _apiPortsToPublishedPorts(pList, pRefs) {
  const ports = _.map(pList, (item) => {
    const res = new KubernetesApplicationPort();
    res.Port = item.port;
    res.TargetPort = item.targetPort;
    res.NodePort = item.nodePort;
    res.Protocol = item.protocol;
    return res;
  });
  _.forEach(ports, (port) => {
    if (isNaN(port.TargetPort)) {
      const targetPort = _.find(pRefs, { name: port.TargetPort });
      if (targetPort) {
        port.TargetPort = targetPort.containerPort;
      }
    }
  });
  return ports;
}

class KubernetesApplicationConverter {
  static applicationCommon(res, data, pods, service, ingresses) {
    const containers = data.spec.template ? _.without(_.concat(data.spec.template.spec.containers, data.spec.template.spec.initContainers), undefined) : data.spec.containers;
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.StackName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationStackNameLabel] || '-' : '-';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] || '' : '';
    res.Note = data.metadata.annotations ? data.metadata.annotations[KubernetesPortainerApplicationNote] || '' : '';
    res.ApplicationName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationNameLabel] || res.Name : res.Name;
    res.ResourcePool = data.metadata.namespace;
    if (containers.length) {
      res.Image = containers[0].image;
    }
    res.CreationDate = data.metadata.creationTimestamp;
    res.Env = _.without(_.flatMap(_.map(containers, 'env')), undefined);
    res.Pods = data.spec.selector ? KubernetesApplicationHelper.associatePodsAndApplication(pods, data.spec.selector) : [data];

    const limits = {
      Cpu: 0,
      Memory: 0,
    };
    res.Limits = _.reduce(
      containers,
      (acc, item) => {
        if (item.resources.limits && item.resources.limits.cpu) {
          acc.Cpu += KubernetesResourceReservationHelper.parseCPU(item.resources.limits.cpu);
        }
        if (item.resources.limits && item.resources.limits.memory) {
          acc.Memory += filesizeParser(item.resources.limits.memory, { base: 10 });
        }
        return acc;
      },
      limits
    );

    const requests = {
      Cpu: 0,
      Memory: 0,
    };
    res.Requests = _.reduce(
      containers,
      (acc, item) => {
        if (item.resources.requests && item.resources.requests.cpu) {
          acc.Cpu += KubernetesResourceReservationHelper.parseCPU(item.resources.requests.cpu);
        }
        if (item.resources.requests && item.resources.requests.memory) {
          acc.Memory += filesizeParser(item.resources.requests.memory, { base: 10 });
        }
        return acc;
      },
      requests
    );

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

      const portsRefs = _.concat(..._.map(containers, (container) => container.ports));
      const ports = _apiPortsToPublishedPorts(service.spec.ports, portsRefs);
      const rules = KubernetesIngressHelper.findSBoundServiceIngressesRules(ingresses, service.metadata.name);
      _.forEach(ports, (port) => (port.IngressRules = _.filter(rules, (rule) => rule.Port === port.Port)));
      res.PublishedPorts = ports;
    }

    if (data.spec.template) {
      res.Volumes = data.spec.template.spec.volumes ? data.spec.template.spec.volumes : [];
    } else {
      res.Volumes = data.spec.volumes;
    }

    // TODO: review
    // this if() fixs direct use of PVC reference inside spec.template.spec.containers[0].volumeMounts
    // instead of referencing the PVC the "good way" using spec.template.spec.volumes array
    // Basically it creates an "in-memory" reference for the PVC, as if it was saved in
    // spec.template.spec.volumes and retrieved from here.
    //
    // FIX FOR SFS ONLY ; as far as we know it's not possible to do this with DEPLOYMENTS/DAEMONSETS
    //
    // This may lead to destructing behaviours when we will allow external apps to be edited.
    // E.G. if we try to generate the formValues and patch the app, SFS reference will be created under
    // spec.template.spec.volumes and not be referenced directly inside spec.template.spec.containers[0].volumeMounts
    // As we preserve original SFS name and try to build around it, it SHOULD be fine, but we definitely need to test this
    // before allowing external apps modification
    if (data.spec.volumeClaimTemplates) {
      const vcTemplates = _.map(data.spec.volumeClaimTemplates, (vc) => {
        return {
          name: vc.metadata.name,
          persistentVolumeClaim: { claimName: vc.metadata.name },
        };
      });
      const inexistingPVC = _.filter(vcTemplates, (vc) => {
        return !_.find(res.Volumes, { persistentVolumeClaim: { claimName: vc.persistentVolumeClaim.claimName } });
      });
      res.Volumes = _.concat(res.Volumes, inexistingPVC);
    }

    const persistedFolders = _.filter(res.Volumes, (volume) => volume.persistentVolumeClaim || volume.hostPath);

    res.PersistedFolders = _.map(persistedFolders, (volume) => {
      const volumeMounts = _.uniq(_.flatMap(_.map(containers, 'volumeMounts')), 'name');
      const matchingVolumeMount = _.find(volumeMounts, { name: volume.name });

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

    res.PersistedFolders = _.without(res.PersistedFolders, undefined);

    res.ConfigurationVolumes = _.reduce(
      res.Volumes,
      (acc, volume) => {
        if (volume.configMap || volume.secret) {
          const matchingVolumeMount = _.find(_.flatMap(_.map(containers, 'volumeMounts')), { name: volume.name });

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
      },
      []
    );
  }

  static apiPodToApplication(data, pods, service, ingresses) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, pods, service, ingresses);
    res.ApplicationType = KubernetesApplicationTypes.POD;
    return res;
  }

  static apiDeploymentToApplication(data, pods, service, ingresses) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, pods, service, ingresses);
    res.ApplicationType = KubernetesApplicationTypes.DEPLOYMENT;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.SHARED;
    res.RunningPodsCount = data.status.availableReplicas || data.status.replicas - data.status.unavailableReplicas || 0;
    res.TotalPodsCount = data.spec.replicas;
    return res;
  }

  static apiDaemonSetToApplication(data, pods, service, ingresses) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, pods, service, ingresses);
    res.ApplicationType = KubernetesApplicationTypes.DAEMONSET;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.GLOBAL;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.SHARED;
    res.RunningPodsCount = data.status.numberAvailable || data.status.desiredNumberScheduled - data.status.numberUnavailable || 0;
    res.TotalPodsCount = data.status.desiredNumberScheduled;
    return res;
  }

  static apiStatefulSetToapplication(data, pods, service, ingresses) {
    const res = new KubernetesApplication();
    KubernetesApplicationConverter.applicationCommon(res, data, pods, service, ingresses);
    res.ApplicationType = KubernetesApplicationTypes.STATEFULSET;
    res.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
    res.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.ISOLATED;
    res.RunningPodsCount = data.status.readyReplicas || 0;
    res.TotalPodsCount = data.spec.replicas;
    res.HeadlessServiceName = data.spec.serviceName;
    return res;
  }

  static applicationToFormValues(app, resourcePools, configurations, persistentVolumeClaims, nodesLabels) {
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
    res.AutoScaler = KubernetesApplicationHelper.generateAutoScalerFormValueFromHorizontalPodAutoScaler(app.AutoScaler, res.ReplicaCount);
    res.PublishedPorts = KubernetesApplicationHelper.generatePublishedPortsFormValuesFromPublishedPorts(app.ServiceType, app.PublishedPorts);
    res.Containers = app.Containers;

    const isIngress = _.filter(res.PublishedPorts, (p) => p.IngressName).length;
    if (app.ServiceType === KubernetesServiceTypes.LOAD_BALANCER) {
      res.PublishingType = KubernetesApplicationPublishingTypes.LOAD_BALANCER;
    } else if (app.ServiceType === KubernetesServiceTypes.NODE_PORT) {
      res.PublishingType = KubernetesApplicationPublishingTypes.CLUSTER;
    } else if (app.ServiceType === KubernetesServiceTypes.CLUSTER_IP && isIngress) {
      res.PublishingType = KubernetesApplicationPublishingTypes.INGRESS;
    } else {
      res.PublishingType = KubernetesApplicationPublishingTypes.INTERNAL;
    }

    KubernetesApplicationHelper.generatePlacementsFormValuesFromAffinity(res, app.Pods[0].Affinity, nodesLabels);
    return res;
  }

  static applicationFormValuesToApplication(formValues) {
    formValues.ApplicationOwner = KubernetesCommonHelper.ownerToLabel(formValues.ApplicationOwner);

    const claims = KubernetesPersistentVolumeClaimConverter.applicationFormValuesToVolumeClaims(formValues);
    const rwx = _.find(claims, (item) => _.includes(item.StorageClass.AccessModes, 'RWX')) !== undefined;

    const deployment =
      (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED &&
        (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED))) ||
      formValues.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT;

    const statefulSet =
      (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED &&
        claims.length > 0 &&
        formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.ISOLATED) ||
      formValues.ApplicationType === KubernetesApplicationTypes.STATEFULSET;

    const daemonSet =
      (formValues.DeploymentType === KubernetesApplicationDeploymentTypes.GLOBAL &&
        (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED && rwx))) ||
      formValues.ApplicationType === KubernetesApplicationTypes.DAEMONSET;

    let app;
    if (deployment) {
      app = KubernetesDeploymentConverter.applicationFormValuesToDeployment(formValues, claims);
    } else if (statefulSet) {
      app = KubernetesStatefulSetConverter.applicationFormValuesToStatefulSet(formValues, claims);
    } else if (daemonSet) {
      app = KubernetesDaemonSetConverter.applicationFormValuesToDaemonSet(formValues, claims);
    } else {
      throw new PortainerError('Unable to determine which association to use to convert form');
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
