import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';

import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesApplicationRollbackHelper from 'Kubernetes/helpers/application/rollback';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import { KubernetesDeployment } from 'Kubernetes/models/deployment/models';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';
import { KubernetesApplication } from 'Kubernetes/models/application/models';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';
import { KubernetesHorizontalPodAutoScalerHelper } from 'Kubernetes/horizontal-pod-auto-scaler/helper';

class KubernetesApplicationService {
  /* @ngInject */
  constructor(
    $async,
    Authentication,
    KubernetesDeploymentService,
    KubernetesDaemonSetService,
    KubernetesStatefulSetService,
    KubernetesServiceService,
    KubernetesSecretService,
    KubernetesPersistentVolumeClaimService,
    KubernetesNamespaceService,
    KubernetesPodService,
    KubernetesHistoryService,
    KubernetesHorizontalPodAutoScalerService
  ) {
    this.$async = $async;
    this.Authentication = Authentication;
    this.KubernetesDeploymentService = KubernetesDeploymentService;
    this.KubernetesDaemonSetService = KubernetesDaemonSetService;
    this.KubernetesStatefulSetService = KubernetesStatefulSetService;
    this.KubernetesServiceService = KubernetesServiceService;
    this.KubernetesSecretService = KubernetesSecretService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesHistoryService = KubernetesHistoryService;
    this.KubernetesHorizontalPodAutoScalerService = KubernetesHorizontalPodAutoScalerService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.patchPartialAsync = this.patchPartialAsync.bind(this);
    this.rollbackAsync = this.rollbackAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * UTILS
   */
  _getApplicationApiService(app) {
    let apiService;
    if (app instanceof KubernetesDeployment || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT)) {
      apiService = this.KubernetesDeploymentService;
    } else if (app instanceof KubernetesDaemonSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DAEMONSET)) {
      apiService = this.KubernetesDaemonSetService;
    } else if (app instanceof KubernetesStatefulSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.STATEFULSET)) {
      apiService = this.KubernetesStatefulSetService;
    } else {
      throw new PortainerError('Unable to determine which association to use');
    }
    return apiService;
  }

  /**
   * GET
   */
  async getAsync(namespace, name) {
    try {
      const [deployment, daemonSet, statefulSet, pods, autoScalers] = await Promise.allSettled([
        this.KubernetesDeploymentService.get(namespace, name),
        this.KubernetesDaemonSetService.get(namespace, name),
        this.KubernetesStatefulSetService.get(namespace, name),
        this.KubernetesPodService.get(namespace),
        this.KubernetesHorizontalPodAutoScalerService.get(namespace),
      ]);

      let rootItem;
      let converterFunction;
      if (deployment.status === 'fulfilled') {
        rootItem = deployment;
        converterFunction = KubernetesApplicationConverter.apiDeploymentToApplication;
      } else if (daemonSet.status === 'fulfilled') {
        rootItem = daemonSet;
        converterFunction = KubernetesApplicationConverter.apiDaemonSetToApplication;
      } else if (statefulSet.status === 'fulfilled') {
        rootItem = statefulSet;
        converterFunction = KubernetesApplicationConverter.apiStatefulSetToapplication;
      } else {
        throw new PortainerError('Unable to determine which association to use');
      }

      const services = await this.KubernetesServiceService.get(namespace);
      const boundService = KubernetesServiceHelper.findApplicationBoundService(services, rootItem.value.Raw);
      const service = boundService ? await this.KubernetesServiceService.get(namespace, boundService.metadata.name) : {};

      const application = converterFunction(rootItem.value.Raw, service.Raw);
      application.Yaml = rootItem.value.Yaml;
      application.Raw = rootItem.value.Raw;
      application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods.value, application.Raw);

      const boundScaler = KubernetesHorizontalPodAutoScalerHelper.findApplicationBoundScaler(autoScalers.value, application);
      const scaler = boundScaler ? await this.KubernetesHorizontalPodAutoScalerService.get(namespace, boundScaler.Name) : undefined;
      application.AutoScaler = scaler;

      await this.KubernetesHistoryService.get(application);

      if (service.Yaml) {
        application.Yaml += '---\n' + service.Yaml;
      }
      if (scaler && scaler.Yaml) {
        application.Yaml += '---\n' + scaler.Yaml;
      }
      return application;
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync(namespace) {
    try {
      const namespaces = namespace ? [namespace] : _.map(await this.KubernetesNamespaceService.get(), 'Name');
      const res = await Promise.all(
        _.map(namespaces, async (ns) => {
          const [deployments, daemonSets, statefulSets, services, pods] = await Promise.all([
            this.KubernetesDeploymentService.get(ns),
            this.KubernetesDaemonSetService.get(ns),
            this.KubernetesStatefulSetService.get(ns),
            this.KubernetesServiceService.get(ns),
            this.KubernetesPodService.get(ns),
          ]);
          const deploymentApplications = _.map(deployments, (item) => {
            const service = KubernetesServiceHelper.findApplicationBoundService(services, item);
            const application = KubernetesApplicationConverter.apiDeploymentToApplication(item, service);
            application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods, item);
            return application;
          });
          const daemonSetApplications = _.map(daemonSets, (item) => {
            const service = KubernetesServiceHelper.findApplicationBoundService(services, item);
            const application = KubernetesApplicationConverter.apiDaemonSetToApplication(item, service);
            application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods, item);
            return application;
          });
          const statefulSetApplications = _.map(statefulSets, (item) => {
            const service = KubernetesServiceHelper.findApplicationBoundService(services, item);
            const application = KubernetesApplicationConverter.apiStatefulSetToapplication(item, service);
            application.Pods = KubernetesApplicationHelper.associatePodsAndApplication(pods, item);
            return application;
          });
          return _.concat(deploymentApplications, daemonSetApplications, statefulSetApplications);
        })
      );
      return _.flatten(res);
    } catch (err) {
      throw err;
    }
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
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
          return this.KubernetesPersistentVolumeClaimService.patch(oldClaim, newClaim);
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
        Note: oldApp.Note,
      };
      const newAppPayload = {
        Name: newApp.Name,
        Namespace: newApp.ResourcePool,
        StackName: newApp.StackName,
        Note: newApp.Note,
      };
      const apiService = this._getApplicationApiService(oldApp);
      await apiService.patch(oldAppPayload, newAppPayload);
    } catch (err) {
      throw err;
    }
  }

  // accept either formValues or applications as parameters
  // depending on partial value
  // true = KubernetesApplication
  // false = KubernetesApplicationFormValues
  patch(oldValues, newValues, partial = false) {
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
        Name: application.Name,
      };
      const servicePayload = angular.copy(payload);
      servicePayload.Name = application.Name;

      const apiService = this._getApplicationApiService(application);
      await apiService.delete(payload);

      if (apiService === this.KubernetesStatefulSetService) {
        const headlessServicePayload = angular.copy(payload);
        headlessServicePayload.Name = application instanceof KubernetesStatefulSet ? application.ServiceName : application.HeadlessServiceName;
        await this.KubernetesServiceService.delete(headlessServicePayload);
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

  /**
   * ROLLBACK
   */
  async rollbackAsync(application, targetRevision) {
    try {
      const payload = KubernetesApplicationRollbackHelper.getPatchPayload(application, targetRevision);
      const apiService = this._getApplicationApiService(application);
      await apiService.rollback(application.ResourcePool, application.Name, payload);
    } catch (err) {
      throw err;
    }
  }

  rollback(application, targetRevision) {
    return this.$async(this.rollbackAsync, application, targetRevision);
  }
}

export default KubernetesApplicationService;
angular.module('portainer.kubernetes').service('KubernetesApplicationService', KubernetesApplicationService);
