import _ from 'lodash-es';
import { KubernetesPodViewModel } from 'Kubernetes/models/pod';

class KubernetesApplicationHelper {
  static associatePodsAndApplication(pods, app) {
    const filteredPods = _.filter(pods, {metadata:{labels: app.spec.selector.matchLabels}});
    app.Pods = _.map(filteredPods, (item) => new KubernetesPodViewModel(item));
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