// import _ from 'lodash-es';
import KubernetesDeploymentModelFromApplication from 'Kubernetes/models/deployment';
import {KubernetesApplicationDeploymentTypes} from 'Kubernetes/models/application';
import KubernetesDaemonSetModelFromApplication from 'Kubernetes/models/daemonset';

angular.module("portainer.kubernetes").factory("KubernetesApplicationService", [
  "$async", "KubernetesDeploymentService", "KubernetesDaemonSetService",
  function KubernetesApplicationServiceFactory($async, KubernetesDeploymentService, KubernetesDaemonSetService) {
    "use strict";
    const service = {
      create: create,
    };

    /**
     * Creation
     */
    async function createAsync(applicationFormValues) {
      try {

        if (applicationFormValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED) {
          const deployment = new KubernetesDeploymentModelFromApplication(applicationFormValues);
          return await KubernetesDeploymentService.create(deployment).$promise;
        }

        const daemonSet = new KubernetesDaemonSetModelFromApplication(applicationFormValues);
        return await KubernetesDaemonSetService.create(daemonSet).$promise;
      } catch (err) {
        throw { msg: 'Unable to create application', err:err };
      }
    }

    function create(applicationFormValues) {
      return $async(createAsync, applicationFormValues);
    }

    return service;
  }
]);
