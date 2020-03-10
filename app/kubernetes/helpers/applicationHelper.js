import _ from 'lodash-es';
import { KubernetesPortMappingPort, KubernetesPortMapping } from 'Kubernetes/models/port/models';
import { KubernetesApplicationSecret } from 'Kubernetes/models/secret/models';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesPodConverter from 'Kubernetes/converters/pod';

class KubernetesApplicationHelper {

  static generateApplicationVolumeName(applicationName, volumePath) {
    return applicationName + volumePath.replace(/[^a-z0-9\-]/gi, '-').toLowerCase();
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

  static generateEnvAndSecretFromEnvVariables(app, envVariables) {
    const secret = new KubernetesApplicationSecret();
    secret.Name = app.Name;
    secret.Namespace = app.Namespace;
    _.forEach(envVariables, (item) => {
      let envVar = {
        name: item.Name
      };

      if (item.IsSecret) {
        envVar.valueFrom = {
          secretKeyRef: {
            name: app.Name,
            key: item.Name
          }
        };

        secret.Data[item.Name] = btoa(unescape(encodeURIComponent(item.Value)));
      } else {
        envVar.value = item.Value
      }

      app.Env.push(envVar);
    });
    if (!_.isEmpty(secret.Data)) {
      app.Secret = secret;
    }
    return app;
  }

  static generateVolumesFromPersistedFolders(app, persistedFolders) {
    app.VolumeMounts = [];
    app.Volumes = [];
    _.forEach(persistedFolders, (item) => {
      const name = KubernetesApplicationHelper.generateApplicationVolumeName(app.Name, item.ContainerPath);
      const volumeMount = {
        mountPath: item.ContainerPath,
        name: name
      };

      app.VolumeMounts.push(volumeMount);

      const volume = {
        name: name,
        persistentVolumeClaim: {
          claimName: name
        }
      };

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