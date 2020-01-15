import _ from 'lodash-es';
import KubernetesDeploymentModelFromApplication from 'Kubernetes/models/deployment';
import { KubernetesApplicationDeploymentTypes, KubernetesApplicationViewModel } from 'Kubernetes/models/application';
import KubernetesDaemonSetModelFromApplication from 'Kubernetes/models/daemonset';
import KubernetesServiceModelFromApplication from 'Kubernetes/models/service';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

angular.module("portainer.kubernetes").factory("KubernetesApplicationService", [
  '$async', 'KubernetesDeploymentService', 'KubernetesDaemonSetService', 'KubernetesServiceService', 'KubernetesPods',
  function KubernetesApplicationServiceFactory($async, KubernetesDeploymentService, KubernetesDaemonSetService, KubernetesServiceService, KubernetesPods) {
    "use strict";
    const service = {
      applications: applications,
      application: application,
      create: create,
      remove: remove
    };

    /**
     * Applications
     */
    async function applicationsAsync() {
      try {
        const [deployments, daemonSets, services] = await Promise.all([
          KubernetesDeploymentService.deployments(),
          KubernetesDaemonSetService.daemonSets(),
          KubernetesServiceService.services()
        ]);
        const deploymentApplications = _.map(deployments, (item) => {
          const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
          return new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.REPLICATED, item, service);
        });
        const daemonSetApplications = _.map(daemonSets, (item) => {
          const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
          return new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.GLOBAL, item, service);
        });
        const applications = _.concat(deploymentApplications, daemonSetApplications);
        return applications;
      } catch (err) {
        throw err;
      }
    }

    function applications() {
      return $async(applicationsAsync);
    }

    /**
     * Application
     */
    async function applicationAsync(namespace, name) {
      try {
        const [deployment, daemonSet, service, pods] = await Promise.allSettled([
          KubernetesDeploymentService.deployment(namespace, name),
          KubernetesDaemonSetService.daemonSet(namespace, name),
          KubernetesServiceService.service(namespace, name),
          KubernetesPods(namespace).query().$promise
        ]);

        if (deployment.status === 'fulfilled') {
          KubernetesApplicationHelper.associatePodsAndApplication(pods.value.items, deployment.value.Raw);
          const application = new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.REPLICATED, deployment.value.Raw, service.value);
          application.Yaml = deployment.value.Yaml.data;
          return application;
        }
        KubernetesApplicationHelper.associatePodsAndApplication(pods.value.items, daemonSet.value.Raw);
        const application = new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.GLOBAL, daemonSet.value.Raw, service.value);
        application.Yaml = daemonSet.value.Yaml;
        return application;
      } catch (err) {
        throw err;
      }
    }

    function application(namespace, name) {
      return $async(applicationAsync, namespace, name);
    }

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

    /**
     * Delete
     */

    /**
     *
     * @param {KubernetesApplicationViewModel} application
     */
    async function removeAsync(application) {
      const payload = {
        Namespace: application.ResourcePool,
        Name: application.Name
      };
      try {
        if (application.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED) {
          await KubernetesDeploymentService.remove(payload);
        } else {
          await KubernetesDaemonSetService.remove(payload);
        }
        if (application.ServiceType && application.ServiceType === 'LoadBalancer') {
          await KubernetesServiceService.remove(payload);
        }
      } catch (err) {
        throw err;
      }
    }

    function remove(application) {
      return $async(removeAsync, application);
    }

    return service;
  }
]);
