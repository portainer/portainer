import KubernetesDeploymentModelFromApplication from 'Kubernetes/models/deployment';
import {KubernetesApplicationDeploymentTypes} from 'Kubernetes/models/application';
import KubernetesDaemonSetModelFromApplication from 'Kubernetes/models/daemonset';
import KubernetesServiceModelFromApplication from 'Kubernetes/models/service';

angular.module("portainer.kubernetes").factory("KubernetesApplicationService", [
  "$async", "KubernetesDeploymentService", "KubernetesDaemonSetService", "KubernetesServiceService",
  function KubernetesApplicationServiceFactory($async, KubernetesDeploymentService, KubernetesDaemonSetService, KubernetesServiceService) {
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
          await KubernetesDeploymentService.create(deployment);
        } else {
          const daemonSet = new KubernetesDaemonSetModelFromApplication(applicationFormValues);
          await KubernetesDaemonSetService.create(daemonSet);
        }

        const service = new KubernetesServiceModelFromApplication(applicationFormValues);
        if (service.Ports.length === 0) {
          return;
        }

        return await KubernetesServiceService.create(service);
      } catch (err) {
        throw err;
      }
    }

    function create(applicationFormValues) {
      return $async(createAsync, applicationFormValues);
    }

    return service;
  }
]);
