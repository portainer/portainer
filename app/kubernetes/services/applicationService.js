import _ from 'lodash-es';
import KubernetesDeploymentModelFromApplication from 'Kubernetes/models/deployment';
import { KubernetesApplicationDeploymentTypes, KubernetesApplicationViewModel } from 'Kubernetes/models/application';
import KubernetesDaemonSetModelFromApplication from 'Kubernetes/models/daemon-set/daemonSet';
import KubernetesServiceModelFromApplication from 'Kubernetes/models/service';
import KubernetesPersistentVolumeClaimsFromApplication from 'Kubernetes/models/persistentVolumeClaim';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

angular.module("portainer.kubernetes").factory("KubernetesApplicationService", [
  '$async', 'KubernetesDeploymentService', 'KubernetesDaemonSetService', 'KubernetesServiceService', 'KubernetesPods',
  'KubernetesSecretService', 'KubernetesPersistentVolumeClaimService', 'Authentication', 'KubernetesNamespaceService',
  function KubernetesApplicationServiceFactory($async, KubernetesDeploymentService, KubernetesDaemonSetService,
    KubernetesServiceService, KubernetesPods, KubernetesSecretService,
    KubernetesPersistentVolumeClaimService, Authentication,
    KubernetesNamespaceService) {
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
    async function applicationsFilteredAsync(namespace) {
      try {
        let namespaces;
        if (namespace) {
          const ns = await KubernetesNamespaceService.namespace(namespace);
          namespaces = [ns];
        } else {
          namespaces = await KubernetesNamespaceService.namespaces();
        }
        const promises = _.map(namespaces, (item) => applicationsAsync(item.Name));
        const res = await Promise.all(promises);
        return _.flatten(res);
      } catch (err) {
        throw err;
      }
    }

    async function applicationsAsync(namespace) {
      try {
        const [deployments, daemonSets, services] = await Promise.all([
          KubernetesDeploymentService.get(namespace),
          KubernetesDaemonSetService.get(namespace),
          KubernetesServiceService.services(namespace)
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

    function applications(namespace) {
      const isAdmin = Authentication.isAdmin();
      if (!isAdmin) {
        return $async(applicationsFilteredAsync, namespace);
      }
      return $async(applicationsAsync, namespace);
    }

    /**
     * Application
     */
    async function applicationAsync(namespace, name) {
      try {
        const [deployment, daemonSet, serviceAttempt, pods] = await Promise.allSettled([
          KubernetesDeploymentService.gets(namespace, name),
          KubernetesDaemonSetService.get(namespace, name),
          KubernetesServiceService.service(namespace, name),
          KubernetesPods(namespace).get().$promise
        ]);
        const service = {};
        if (serviceAttempt.status === 'fulfilled') {
          service.Raw = serviceAttempt.value.Raw;
          service.Yaml = serviceAttempt.value.Yaml;
        }

        if (deployment.status === 'fulfilled') {
          KubernetesApplicationHelper.associatePodsAndApplication(pods.value.items, deployment.value.Raw);
          const application = new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.REPLICATED, deployment.value.Raw, service.Raw);
          application.Yaml = deployment.value.Yaml.data;
          if (service.Yaml) {
            application.Yaml += '---\n' + service.Yaml.data;
          }
          return application;
        }
        KubernetesApplicationHelper.associatePodsAndApplication(pods.value.items, daemonSet.value.Raw);
        const application = new KubernetesApplicationViewModel(KubernetesApplicationDeploymentTypes.GLOBAL, daemonSet.value.Raw, service.Raw);
        application.Yaml = daemonSet.value.Yaml.data;
        if (service.Yaml) {
          application.Yaml += '---\n' + service.Yaml.data;
        }
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

        const claims = new KubernetesPersistentVolumeClaimsFromApplication(applicationFormValues);
        // TODO: refactor that for parallelization
        _.forEach(claims.Claims, async (claim) => {
          await KubernetesPersistentVolumeClaimService.create(claim);
        });

        if (applicationFormValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED) {
          const deployment = new KubernetesDeploymentModelFromApplication(applicationFormValues);

          if (!_.isEmpty(deployment.Secret.Data)) {
            await KubernetesSecretService.create(deployment.Secret);
          }

          await KubernetesDeploymentService.create(deployment);
        } else {
          const daemonSet = new KubernetesDaemonSetModelFromApplication(applicationFormValues);

          if (!_.isEmpty(daemonSet.Secret.Data)) {
            await KubernetesSecretService.create(daemonSet.Secret);
          }

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
          await KubernetesDeploymentService.delete(payload);
        } else {
          await KubernetesDaemonSetService.delete(payload);
        }
        if (application.ServiceType) {
          await KubernetesServiceService.remove(payload);
        }
        // TODO: refactor that for parallelization
        _.forEach(application.Volumes, async (claim) => {
          await KubernetesPersistentVolumeClaimService.remove(claim.persistentVolumeClaim.claimName, application.ResourcePool);
        });
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
