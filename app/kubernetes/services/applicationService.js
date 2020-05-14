import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';

import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import { KubernetesDeployment } from 'Kubernetes/models/deployment/models';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';

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
    this.patchAsync = this.patchAsync.bind(this);
    this.patchPartialAsync = this.patchPartialAsync.bind(this);
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
        this.KubernetesPods(namespace).get().$promise // TODO: review, use service
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

  // TODO: review, remove function
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
      const [deployments, daemonSets, statefulSets, services, pods] = await Promise.all([
        this.KubernetesDeploymentService.get(namespace),
        this.KubernetesDaemonSetService.get(namespace),
        this.KubernetesStatefulSetService.get(namespace),
        this.KubernetesServiceService.get(namespace),
        this.KubernetesPods(namespace).get().$promise
      ]);
      const deploymentApplications = _.map(deployments, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        const application = KubernetesApplicationConverter.apiDeploymentToApplication(item, service);
        application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods.items, item);
        return application;
      });
      const daemonSetApplications = _.map(daemonSets, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        const application = KubernetesApplicationConverter.apiDaemonSetToApplication(item, service);
        application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods.items, item);
        return application;
      });
      const statefulSetApplications = _.map(statefulSets, (item) => {
        const service = _.find(services, (serv) => item.metadata.name === serv.metadata.name);
        const application = KubernetesApplicationConverter.apiStatefulSetToapplication(item, service);
        application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods.items, item);
        return application;
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
  // TODO: review
  // resource creation flow
  // should we keep formValues > Resource_1 || Resource_2
  // or should we switch to formValues > Composite > Resource_1 || Resource_2
  async createAsync(formValues) {
    try {
      let [app, headlessService, service, claims] = KubernetesApplicationConverter.applicationFormValuesToApplication(formValues);

      if (service) {
        await this.KubernetesServiceService.create(service);
      }

      const apiService = this._getApplicationApiService(app);

      if (app instanceof KubernetesStatefulSet) {
        app.VolumeClaims = claims;
        headlessService = await this.KubernetesServiceService.create(headlessService);
        app.ServiceName = headlessService.metadata.name;
      } else {
        const claimPromises = _.map(claims, (item) => {
          if (!item.PreviousName) {
            return this.KubernetesPersistentVolumeClaimService.create(item);
          }
        });
        await Promise.all(_.without(claimPromises, undefined));
      }

      await apiService.create(app);

    } catch (err) {
      throw err;
    }
  }

  create(formValues) {
    return this.$async(this.createAsync, formValues);
  }

  _getApplicationApiService(app) {
    let apiService;
    if (app instanceof KubernetesDeployment) {
      apiService = this.KubernetesDeploymentService;
    } else if (app instanceof KubernetesStatefulSet) {
      apiService = this.KubernetesStatefulSetService;
    } else if (app instanceof KubernetesDaemonSet) {
      apiService = this.KubernetesDaemonSetService;
    } else {
      throw new PortainerError('Unable to determine which association to use');
    }
    return apiService;
  }

  /**
   * PATCH
   */
  // this function accepts KubernetesApplicationFormValues as parameters
  async patchAsync(oldFormValues, newFormValues) {
    try {
      const [oldApp, oldHeadlessService, oldService, oldClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(oldFormValues);
      const [newApp, newHeadlessService, newService, newClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(newFormValues);
      const oldApiService = this._getApplicationApiService(oldApp);
      const newApiService = this._getApplicationApiService(newApp);

      if (oldApiService !== newApiService) {
        await this.delete(oldApp);
        if (oldService) {
          await this.KubernetesServiceService.delete(oldService);
        }
        return await this.create(newFormValues);
      }

      if (newApp instanceof KubernetesStatefulSet) {
        await this.KubernetesServiceService.patch(oldHeadlessService, newHeadlessService);
      } else {
        const claimPromises = _.map(newClaims, (newClaim) => {
          if (!newClaim.PreviousName) {
            return this.KubernetesPersistentVolumeClaimService.create(newClaim);
          }
          const oldClaim = _.find(oldClaims, { Name: newClaim.PreviousName });
          return this.KubernetesPersistentVolumeClaimService.patch(oldClaim, newClaim)
        });
        await Promise.all(claimPromises);
      }

      await newApiService.patch(oldApp, newApp);

      if (oldService && newService) {
        await this.KubernetesServiceService.patch(oldService, newService);
      } else if (!oldService && newService) {
        await this.KubernetesServiceService.create(newService);
      } else if (oldService && !newService) {
        await this.KubernetesServiceService.delete(oldService);
      }

    } catch (err) {
      throw err;
    }
  }

  // this function accepts KubernetesApplication as parameters
  async patchPartialAsync(oldApp, newApp) {
    try {
      const oldAppPayload = {
        Name: oldApp.Name,
        Namespace: oldApp.ResourcePool,
        StackName: oldApp.StackName,
        Note: oldApp.Note
      };
      const newAppPayload = {
        Name: newApp.Name,
        Namespace: newApp.ResourcePool,
        StackName: newApp.StackName,
        Note: newApp.Note
      };
      switch (oldApp.ApplicationType) {
        case KubernetesApplicationTypes.DEPLOYMENT:
          await this.KubernetesDeploymentService.patch(oldAppPayload, newAppPayload);
          break;
        case KubernetesApplicationTypes.DAEMONSET:
          await this.KubernetesDaemonSetService.patch(oldAppPayload, newAppPayload);
          break;
        case KubernetesApplicationTypes.STATEFULSET:
          await this.KubernetesStatefulSetService.patch(oldAppPayload, newAppPayload);
          break;
        default:
          throw new PortainerError('Unable to determine which association to patch');
      }
    } catch (err) {
      throw err;
    }
  }

  // accept either formValues or applications as parameters
  // depending on partial value
  // true = KubernetesApplication
  // false = KubernetesApplicationFormValues
  patch(oldValues, newValues, partial=false) {
    if (partial) {
      return this.$async(this.patchPartialAsync, oldValues, newValues);
    }
    return this.$async(this.patchAsync, oldValues, newValues);
  }

  /**
   * DELETE
   */
  async deleteAsync(application) {
    try {
      const payload = {
        Namespace: application.ResourcePool || application.Namespace,
        Name: application.Name
      };
      const headlessServicePayload = angular.copy(payload);
      const servicePayload = angular.copy(payload);
      servicePayload.Name = application.Name;

      if (application instanceof KubernetesDeployment) {
        application.ApplicationType = KubernetesApplicationTypes.DEPLOYMENT;
      } else if (application instanceof KubernetesDaemonSet) {
        application.ApplicationType = KubernetesApplicationTypes.DAEMONSET;
      } else if (application instanceof KubernetesStatefulSet) {
        application.ApplicationType = KubernetesApplicationTypes.STATEFULSET;
        application.HeadlessServiceName = application.ServiceName;
      }

      switch (application.ApplicationType) {
        case KubernetesApplicationTypes.DEPLOYMENT:
          await this.KubernetesDeploymentService.delete(payload);
          break;
        case KubernetesApplicationTypes.DAEMONSET:
          await this.KubernetesDaemonSetService.delete(payload);
          break;
        case KubernetesApplicationTypes.STATEFULSET:
          headlessServicePayload.Name = application.HeadlessServiceName;
          await this.KubernetesStatefulSetService.delete(payload);
          await this.KubernetesServiceService.delete(headlessServicePayload);
          break;
        default:
          throw new PortainerError('Unable to determine which association to remove');
      }
      if (application.ServiceType) {
        await this.KubernetesServiceService.delete(servicePayload);
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
