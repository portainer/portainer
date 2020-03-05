import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';

import { KubernetesApplicationDeploymentTypes, KubernetesApplicationDataAccessPolicies, KubernetesApplicationTypes } from 'Kubernetes/models/application/models';

import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

import KubernetesDeploymentConverter from 'Kubernetes/converters/deployment';
import KubernetesDaemonSetConverter from 'Kubernetes/converters/daemonSet';
import KubernetesStatefulSetConverter from 'Kubernetes/converters/statefulSet';
import KubernetesServiceConverter from 'Kubernetes/converters/service';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import KubernetesPersistentVolumeClaimConverter from 'Kubernetes/converters/persistentVolumeClaim';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';

class KubernetesApplicationService {
  /* @ngInject */
  constructor($async, Authentication, KubernetesDeploymentService, KubernetesDaemonSetService, KubernetesStatefulSetService, KubernetesServiceService,
    KubernetesSecretService, KubernetesPersistentVolumeClaimService, KubernetesNamespaceService, KubernetesPods) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.KubernetesDeploymentService = KubernetesDeploymentService;
    this.KubernetesDaemonSetService = KubernetesDaemonSetService;
    this.KubernetesStatefulSetService = KubernetesStatefulSetService;
    this.KubernetesServiceService = KubernetesServiceService;
    this.KubernetesSecretService = KubernetesSecretService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesPods = KubernetesPods;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.getAllFilteredAsync = this.getAllFilteredAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const [deployment, daemonSet, statefulSet, serviceAttempt, pods] = await Promise.allSettled([
        this.KubernetesDeploymentService.get(namespace, name),
        this.KubernetesDaemonSetService.get(namespace, name),
        this.KubernetesStatefulSetService.get(namespace, name),
        this.KubernetesServiceService.get(namespace, name),
        this.KubernetesPods(namespace).get().$promise
      ]);
      const service = {};
      if (serviceAttempt.status === 'fulfilled') {
        service.Raw = serviceAttempt.value.Raw;
        service.Yaml = serviceAttempt.value.Yaml;
      }
      let item;
      let application;
      if (deployment.status === 'fulfilled') {
        item = deployment;
        application = KubernetesApplicationConverter.apiDeploymentToApplication(deployment.value.Raw, service.Raw);
      } else if (daemonSet.status === 'fulfilled') {
        item = daemonSet;
        application = KubernetesApplicationConverter.apiDaemonSetToApplication(daemonSet.value.Raw, service.Raw);
      } else if (statefulSet.status === 'fulfilled') {
        item = statefulSet;
        application = KubernetesApplicationConverter.apiStatefulSetToapplication(statefulSet.value.Raw, service.Raw);
      } else {
        throw new PortainerError('Unable to determine which association to use');
      }
      application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods.value.items, item.value.Raw);
      application.Yaml = item.value.Yaml;

      if (service.Yaml) {
        application.Yaml += '---\n' + service.Yaml;
      }
      return application;
    } catch (err) {
      throw err;
    }
  }

  async getAllFilteredAsync(namespace) {
    try {
      let namespaces;
      if (namespace) {
        const ns = await this.KubernetesNamespaceService.get(namespace);
        namespaces = [ns];
      } else {
        namespaces = await this.KubernetesNamespaceService.get();
      }
      const promises = _.map(namespaces, (item) => this.getAllAsync(item.Name));
      const res = await Promise.all(promises);
      return _.flatten(res);
    } catch (err) {
      throw err;
    }
  }


  async getAllAsync(namespace) {
    try {
      const [deployments, daemonSets, statefulSets, services] = await Promise.all([
        this.KubernetesDeploymentService.get(namespace),
        this.KubernetesDaemonSetService.get(namespace),
        this.KubernetesStatefulSetService.get(namespace),
        this.KubernetesServiceService.get(namespace)
      ]);
      const deploymentApplications = _.map(deployments, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        return KubernetesApplicationConverter.apiDeploymentToApplication(item, service);
      });
      const daemonSetApplications = _.map(daemonSets, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        return KubernetesApplicationConverter.apiDaemonSetToApplication(item, service);
      });
      const statefulSetApplications = _.map(statefulSets, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        return KubernetesApplicationConverter.apiStatefulSetToapplication(item, service);
      });
      const applications = _.concat(deploymentApplications, daemonSetApplications, statefulSetApplications);
      return applications;
    } catch (err) {
      throw err;
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    const isAdmin = this.Authentication.isAdmin();
    if (!isAdmin) {
      return this.$async(this.getAllFilteredAsync, namespace);
    }
    return this.$async(this.getAllAsync, namespace);
  }

  /**
   * CREATE
   */
  async createAsync(formValues) {
    try {
      const claims = KubernetesPersistentVolumeClaimConverter.applicationFormValuesToVolumeClaims(formValues);
      const roxrwx = _.find(claims, (item) => _.includes(item.StorageClass.AccessModes, 'ROX') || _.includes(item.StorageClass.AccessModes, 'RWX'));
      let apiService;
      let app;

      const deployment = formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED &&
        (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED));
      const statefulSet = claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.ISOLATED &&
        formValues.DeploymentType === KubernetesApplicationDeploymentTypes.REPLICATED;
      const daemonSet = formValues.DeploymentType === KubernetesApplicationDeploymentTypes.GLOBAL &&
        (claims.length === 0 || (claims.length > 0 && formValues.DataAccessPolicy === KubernetesApplicationDataAccessPolicies.SHARED && roxrwx));

      if (deployment) {
        app = KubernetesDeploymentConverter.applicationFormValuesToDeployment(formValues);
        apiService = this.KubernetesDeploymentService;
      } else if (statefulSet) {
        app = KubernetesStatefulSetConverter.applicationFormValuesToStatefulSet(formValues);
        apiService = this.KubernetesStatefulSetService;
      } else if (daemonSet) {
        app = KubernetesDaemonSetConverter.applicationFormValuesToDaemonSet(formValues);
        apiService = this.KubernetesDaemonSetService;
      } else {
        throw new PortainerError('Unable to determine which association to use');
      }

      if (statefulSet) {
        app.VolumeClaims = claims;
        let headlessService = KubernetesServiceConverter.applicationFormValuesToService(formValues);
        headlessService.Headless = true;
        headlessService = await this.KubernetesServiceService.create(headlessService);
        app.ServiceName = headlessService.metadata.name;
      } else {
        const claimPromises = _.map(claims, (item) => this.KubernetesPersistentVolumeClaimService.create(item));
        await Promise.all(claimPromises);
      }

      if (app.Secret) {
        await this.KubernetesSecretService.create(app.Secret);
      }
      await apiService.create(app);

      const service = KubernetesServiceConverter.applicationFormValuesToService(formValues);
      if (service.Ports.length === 0) {
        return;
      }
      await this.KubernetesServiceService.create(service);
    } catch (err) {
      throw err;
    }
  }

  create(formValues) {
    return this.$async(this.createAsync, formValues);
  }

  /**
   * DELETE
   */
  async deleteAsync(application) {
    try {
      const payload = {
        Namespace: application.ResourcePool,
        Name: application.Name
      };
      const headlessServicePayload = angular.copy(payload);
      headlessServicePayload.Name = KubernetesServiceHelper.generateHeadlessServiceName(application.Name);

      switch (application.ApplicationType) {
        case KubernetesApplicationTypes.DEPLOYMENT:
          await this.KubernetesDeploymentService.delete(payload);
          break;
        case KubernetesApplicationTypes.DAEMONSET:
          await this.KubernetesDaemonSetService.delete(payload);
          break;
        case KubernetesApplicationTypes.STATEFULSET:
          await this.KubernetesStatefulSetService.delete(payload);
          await this.KubernetesServiceService.delete(headlessServicePayload);
          break;
        default:
          throw new PortainerError('Unable to determine which association to remove');
      }
      if (application.ServiceType) {
        await this.KubernetesServiceService.delete(payload);
      }
    } catch (err) {
      throw err;
    }
  }

  delete(application) {
    return this.$async(this.deleteAsync, application);
  }
}

export default KubernetesApplicationService;
angular.module('portainer.kubernetes').service('KubernetesApplicationService', KubernetesApplicationService);
