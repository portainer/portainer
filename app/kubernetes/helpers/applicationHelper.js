import _ from 'lodash-es';
import { KubernetesPortMappingPort, KubernetesPortMapping } from 'Kubernetes/models/port/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesPodConverter from 'Kubernetes/converters/pod';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';
import { KubernetesApplicationConfigurationFormValueOverridenKeyTypes } from 'Kubernetes/models/application/formValues';
import {
  KubernetesApplicationEnvPayload,
  KubernetesApplicationVolumeMountPayload,
  KubernetesApplicationVolumePersistentPayload,
  KubernetesApplicationVolumeConfigMapPayload,
  KubernetesApplicationVolumeSecretPayload,
  KubernetesApplicationEnvSecretPayload,
  KubernetesApplicationEnvConfigMapPayload,
  KubernetesApplicationVolumeEntryPayload
} from 'Kubernetes/models/application/payloads';

class KubernetesApplicationHelper {

  static getUsedVolumes(application, volumes) {
    const names = _.without(_.map(application.Volumes, 'persistentVolumeClaim.claimName'), undefined);
    return _.filter(volumes, (volume) => {
      const matchingNames = _.filter(names, (name) => _.startsWith(volume.PersistentVolumeClaim.Name, name));
      return volume.ResourcePool.Namespace.Name === application.ResourcePool && matchingNames.length;
    });
  }

  static getUsedConfigurations(application, configurations) {
    return _.filter(configurations, (config) => {
      let envFind;
      let volumeFind;
      if (config.Type === KubernetesConfigurationTypes.CONFIGMAP) {
        envFind = _.find(application.Env, { valueFrom: { configMapKeyRef: { name: config.Name }}});
        volumeFind = _.find(application.Volumes, { configMap: { name: config.Name }});
      } else {
        envFind = _.find(application.Env, { valueFrom: { secretKeyRef: { name: config.Name }}});
        volumeFind = _.find(application.Volumes, { secret: { secretName: config.Name }});
      }
      if (envFind || volumeFind) {
        return true;
      }
    });
  }

  static dnsCompliantString(s) {
    return s.replace(/[^a-z0-9\-]/gi, '-').toLowerCase();
  }

  static generateApplicationVolumeName(applicationName, volumePath) {
    return applicationName + KubernetesApplicationHelper.dnsCompliantString(volumePath);
  }

  static associatePodsAndApplication(pods, app) {
    const filteredPods = _.filter(pods, { metadata: { labels: app.spec.selector.matchLabels } });
    return _.map(filteredPods, (item) => KubernetesPodConverter.apiToPod(item));
  }

  static portMappingsFromApplications(applications) {
    const res = _.reduce(applications, (acc, app) => {
      if (app.PublishedPorts.length > 0) {
        const mapping = new KubernetesPortMapping();
        mapping.ApplicationName = app.Name;
        mapping.ResourcePool = app.ResourcePool;
        mapping.ServiceType = app.ServiceType;
        mapping.LoadBalancerIPAddress = app.LoadBalancerIPAddress;

        mapping.Ports = _.map(app.PublishedPorts, (item) => {
          const port = new KubernetesPortMappingPort();
          port.Port = mapping.ServiceType === KubernetesServiceTypes.NODE_PORT ? item.nodePort : item.port;
          port.TargetPort = item.targetPort;
          port.Protocol = item.protocol;
          return port;
        });
        acc.push(mapping);
      }
      return acc;
    }, []);
    return res;
  }

  static generateEnvFromEnvVariables(app, envVariables) {
    const env = _.map(envVariables, (item) => {
      const res = new KubernetesApplicationEnvPayload();
      res.name = item.Name;
      res.value = item.Value;
      return res;
    });
    app.Env = _.concat(app.Env, env);
    return app;
  }

  static generateEnvOrVolumesFromConfigurations(app, configurations) {
    let finalEnv = [];
    let finalVolumes = [];
    let finalMounts = [];

    _.forEach(configurations, (config) => {
      const isBasic = config.SelectedConfiguration.Type === KubernetesConfigurationTypes.CONFIGMAP;

      if (!config.Overriden) {
        const envKeys = _.keys(config.SelectedConfiguration.Data);
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.configMapKeyRef.key = item;
          } else {
            res.valueFrom.secretKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.secretKeyRef.key = item;
          }
          finalEnv.push(res);
        });

      } else {

        const envKeys = _.filter(config.OverridenKeys, (item) => item.Type === KubernetesApplicationConfigurationFormValueOverridenKeyTypes.ENVIRONMENT);
        _.forEach(envKeys, (item) => {
          const res = isBasic ? new KubernetesApplicationEnvConfigMapPayload() : new KubernetesApplicationEnvSecretPayload();
          res.name = item.Key;
          if (isBasic) {
            res.valueFrom.configMapKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.configMapKeyRef.key = item.Key;
          } else {
            res.valueFrom.secretKeyRef.name = config.SelectedConfiguration.Name;
            res.valueFrom.secretKeyRef.key = item.Key;
          }
          finalEnv.push(res);
        });

        const volKeys = _.filter(config.OverridenKeys, (item) => item.Type === KubernetesApplicationConfigurationFormValueOverridenKeyTypes.FILESYSTEM);
        const groupedVolKeys = _.groupBy(volKeys, 'Path');
        _.forEach(groupedVolKeys, (items, path) => {
          const volumeName = KubernetesApplicationHelper.dnsCompliantString('volume-' + path);
          const configurationName = config.SelectedConfiguration.Name;
          const itemsMap = _.map(items, (item) => {
            const entry = new KubernetesApplicationVolumeEntryPayload();
            entry.key = item.Key;
            entry.path = item.Key;
            return entry;
          });

          const mount = isBasic ? new KubernetesApplicationVolumeMountPayload() : new KubernetesApplicationVolumeMountPayload(true);
          const volume = isBasic ? new KubernetesApplicationVolumeConfigMapPayload() : new KubernetesApplicationVolumeSecretPayload();

          mount.name = volumeName;
          mount.mountPath = path;
          volume.name = volumeName;
          if (isBasic) {
            volume.configMap.name = configurationName;
            volume.configMap.items = itemsMap;
          } else {
            volume.secret.secretName = configurationName;
            volume.secret.items = itemsMap;
          }

          finalMounts.push(mount);
          finalVolumes.push(volume);
        });
      }
    });
    app.Env = _.concat(app.Env, finalEnv);
    app.Volumes = _.concat(app.Volumes, finalVolumes);
    app.VolumeMounts = _.concat(app.VolumeMounts, finalMounts);
    return app;
  }

  static generateVolumesFromPersistedFolders(app, persistedFolders) {
    app.VolumeMounts = [];
    app.Volumes = [];
    _.forEach(persistedFolders, (item) => {
      const name = KubernetesApplicationHelper.generateApplicationVolumeName(app.Name, item.ContainerPath);
      const volumeMount = new KubernetesApplicationVolumeMountPayload();
      volumeMount.name = name;
      volumeMount.mountPath = item.ContainerPath;
      app.VolumeMounts.push(volumeMount);

      const volume = new KubernetesApplicationVolumePersistentPayload();
      volume.name = name;
      volume.persistentVolumeClaim.claimName = name;
      app.Volumes.push(volume);
    });
    return app;
  }

}
export default KubernetesApplicationHelper;

// Keeping this code if we want to switch matching on labels instead of name
// Conceptually here, services === applications

// import _ from 'lodash-es';

// angular.module('portainer.kubernetes')
// .factory('KubernetesServiceHelper', [function KubernetesServiceHelperFactory() {
//   'use strict';

//   var helper = {};

//   helper.associateServicesAndDeployments = function(services, deployments) {
//     _.forEach(deployments, (deployment) => deployment.BoundServices = []);
//     _.forEach(services, (service) => {
//       if (service.spec.selector) {
//         const deps = _.filter(deployments, {spec:{template:{metadata:{labels: service.spec.selector}}}});
//         _.forEach(deps, (deployment) => deployment.BoundServices.push(service));
//       }
//     });
//   };

//   helper.associateContainersAndDeployment = function(containers, deployment) {
//     deployment.Containers = _.filter(containers, {metadata:{labels: deployment.spec.selector.matchLabels}});
//   };

//   return helper;
// }]);
