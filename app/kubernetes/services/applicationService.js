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
    // TODO: review @LP
    // An application is a composite object that requires the creation of multiple Kubernetes resources
    // depending on the application configuration. The creation takes the form values and creates the associated resources
    // using the model conversion functions defined in models/<resource>.js
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
          // TODO: review @LP
          // Basically if a service has no ports defined, we should not create a Service object.
          // I didn't know how to return an empty promise or something else here so asking for your help :-)
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
