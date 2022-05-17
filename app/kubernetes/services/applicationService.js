import _ from 'lodash-es';
import angular from 'angular';
import PortainerError from 'Portainer/error';

import {
  KubernetesApplication,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationTypes,
} from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesApplicationRollbackHelper from 'Kubernetes/helpers/application/rollback';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import { KubernetesDeployment } from 'Kubernetes/models/deployment/models';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';
import { KubernetesHorizontalPodAutoScalerHelper } from 'Kubernetes/horizontal-pod-auto-scaler/helper';
import { KubernetesHorizontalPodAutoScalerConverter } from 'Kubernetes/horizontal-pod-auto-scaler/converter';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import KubernetesPodConverter from 'Kubernetes/pod/converter';

class KubernetesApplicationService {
  /* #region  CONSTRUCTOR */
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
    KubernetesHorizontalPodAutoScalerService,
    KubernetesIngressService
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
    this.KubernetesIngressService = KubernetesIngressService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.patchAsync = this.patchAsync.bind(this);
    this.patchPartialAsync = this.patchPartialAsync.bind(this);
    this.rollbackAsync = this.rollbackAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }
  /* #endregion */

  /* #region  UTILS */
  _getApplicationApiService(app) {
    let apiService;
    if (app instanceof KubernetesDeployment || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT)) {
      apiService = this.KubernetesDeploymentService;
    } else if (app instanceof KubernetesDaemonSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DAEMONSET)) {
      apiService = this.KubernetesDaemonSetService;
    } else if (app instanceof KubernetesStatefulSet || (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.STATEFULSET)) {
      apiService = this.KubernetesStatefulSetService;
    } else if (app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.POD) {
      apiService = this.KubernetesPodService;
    } else {
      throw new PortainerError('Unable to determine which association to use to retrieve API Service');
    }
    return apiService;
  }

  _generateIngressPatchPromises(oldIngresses, newIngresses) {
    return _.map(newIngresses, (newIng) => {
      const oldIng = _.find(oldIngresses, { Name: newIng.Name });
      return this.KubernetesIngressService.patch(oldIng, newIng);
    });
  }
  /* #endregion */

  /* #region  GET */
  async getAsync(namespace, name) {
    const [deployment, daemonSet, statefulSet, pod, pods, autoScalers, ingresses] = await Promise.allSettled([
      this.KubernetesDeploymentService.get(namespace, name),
      this.KubernetesDaemonSetService.get(namespace, name),
      this.KubernetesStatefulSetService.get(namespace, name),
      this.KubernetesPodService.get(namespace, name),
      this.KubernetesPodService.get(namespace),
      this.KubernetesHorizontalPodAutoScalerService.get(namespace),
      this.KubernetesIngressService.get(namespace),
    ]);

    let rootItem;
    let converterFunc;
    if (deployment.status === 'fulfilled') {
      rootItem = deployment;
      converterFunc = KubernetesApplicationConverter.apiDeploymentToApplication;
    } else if (daemonSet.status === 'fulfilled') {
      rootItem = daemonSet;
      converterFunc = KubernetesApplicationConverter.apiDaemonSetToApplication;
    } else if (statefulSet.status === 'fulfilled') {
      rootItem = statefulSet;
      converterFunc = KubernetesApplicationConverter.apiStatefulSetToapplication;
    } else if (pod.status === 'fulfilled') {
      rootItem = pod;
      converterFunc = KubernetesApplicationConverter.apiPodToApplication;
    } else {
      throw new PortainerError('Unable to determine which association to use to convert application');
    }

    const services = await this.KubernetesServiceService.get(namespace);
    const boundService = KubernetesServiceHelper.findApplicationBoundService(services, rootItem.value.Raw);
    const service = boundService ? await this.KubernetesServiceService.get(namespace, boundService.metadata.name) : {};
    const boundServices = KubernetesServiceHelper.findApplicationBoundServices(services, rootItem.value.Raw);

    const application = converterFunc(rootItem.value.Raw, pods.value, service.Raw, ingresses.value);
    application.Yaml = rootItem.value.Yaml;
    application.Raw = rootItem.value.Raw;
    application.Pods = _.map(application.Pods, (item) => KubernetesPodConverter.apiToModel(item));
    application.Containers = KubernetesApplicationHelper.associateContainersAndApplication(application);
    application.Services = boundServices;

    const boundScaler = KubernetesHorizontalPodAutoScalerHelper.findApplicationBoundScaler(autoScalers.value, application);
    const scaler = boundScaler ? await this.KubernetesHorizontalPodAutoScalerService.get(namespace, boundScaler.Name) : undefined;
    application.AutoScaler = scaler;
    application.Ingresses = ingresses;

    await this.KubernetesHistoryService.get(application);

    if (service.Yaml) {
      application.Yaml += '---\n' + service.Yaml;
    }
    if (scaler && scaler.Yaml) {
      application.Yaml += '---\n' + scaler.Yaml;
    }
    // TODO: refactor @LP
    // append ingress yaml ?
    return application;
  }

  async getAllAsync(namespace) {
    const namespaces = namespace ? [namespace] : _.map(await this.KubernetesNamespaceService.get(), 'Name');

    const convertToApplication = (item, converterFunc, services, pods, ingresses) => {
      const service = KubernetesServiceHelper.findApplicationBoundService(services, item);
      const servicesFound = KubernetesServiceHelper.findApplicationBoundServices(services, item);
      const application = converterFunc(item, pods, service, ingresses);
      application.Containers = KubernetesApplicationHelper.associateContainersAndApplication(application);
      application.Services = servicesFound;
      return application;
    };

    const res = await Promise.all(
      _.map(namespaces, async (ns) => {
        const [deployments, daemonSets, statefulSets, services, pods, ingresses, autoScalers] = await Promise.all([
          this.KubernetesDeploymentService.get(ns),
          this.KubernetesDaemonSetService.get(ns),
          this.KubernetesStatefulSetService.get(ns),
          this.KubernetesServiceService.get(ns),
          this.KubernetesPodService.get(ns),
          this.KubernetesIngressService.get(ns),
          this.KubernetesHorizontalPodAutoScalerService.get(ns),
        ]);

        const deploymentApplications = _.map(deployments, (item) =>
          convertToApplication(item, KubernetesApplicationConverter.apiDeploymentToApplication, services, pods, ingresses)
        );
        const daemonSetApplications = _.map(daemonSets, (item) => convertToApplication(item, KubernetesApplicationConverter.apiDaemonSetToApplication, services, pods, ingresses));
        const statefulSetApplications = _.map(statefulSets, (item) =>
          convertToApplication(item, KubernetesApplicationConverter.apiStatefulSetToapplication, services, pods, ingresses)
        );

        const boundPods = _.concat(_.flatMap(deploymentApplications, 'Pods'), _.flatMap(daemonSetApplications, 'Pods'), _.flatMap(statefulSetApplications, 'Pods'));
        const unboundPods = _.without(pods, ...boundPods);
        const nakedPodsApplications = _.map(unboundPods, (item) => convertToApplication(item, KubernetesApplicationConverter.apiPodToApplication, services, pods, ingresses));

        const applications = _.concat(deploymentApplications, daemonSetApplications, statefulSetApplications, nakedPodsApplications);
        _.forEach(applications, (app) => {
          app.Pods = _.map(app.Pods, (item) => KubernetesPodConverter.apiToModel(item));
        });
        await Promise.all(
          _.forEach(applications, async (application) => {
            const boundScaler = KubernetesHorizontalPodAutoScalerHelper.findApplicationBoundScaler(autoScalers, application);
            const scaler = boundScaler ? await this.KubernetesHorizontalPodAutoScalerService.get(ns, boundScaler.Name) : undefined;
            application.AutoScaler = scaler;
            application.Ingresses = await this.KubernetesIngressService.get(ns);
          })
        );
        return applications;
      })
    );
    return _.flatten(res);
  }

  get(namespace, name) {
    if (name) {
      return this.$async(this.getAsync, namespace, name);
    }
    return this.$async(this.getAllAsync, namespace);
  }
  /* #endregion */

  /* #region  CREATE */
  // TODO: review
  // resource creation flow
  // should we keep formValues > Resource_1 || Resource_2
  // or should we switch to formValues > Composite > Resource_1 || Resource_2
  /**
   * NOTE: Keep this method flow in sync with `getCreatedApplicationResources` method in the `applicationService` file
   *    To synchronise with kubernetes resource creation summary output, any new resources created in this method should
   *    also be displayed in the summary output (getCreatedApplicationResources)
   */
  async createAsync(formValues) {
    // formValues -> Application
    let [app, headlessService, services, service, claims] = KubernetesApplicationConverter.applicationFormValuesToApplication(formValues);

    if (services) {
      services.forEach(async (service) => {
        await this.KubernetesServiceService.create(service);
      });

      //Generate all ingresses from current form by passing services object
      const ingresses = KubernetesIngressConverter.generateNewIngresses(formValues.OriginalIngresses, services);
      if (ingresses) {
        //Update original ingress with current ingress
        await Promise.all(this._generateIngressPatchPromises(formValues.OriginalIngresses, ingresses));
      }
    }

    if (service) {
      await this.KubernetesServiceService.create(service);
      if (formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
        const ingresses = KubernetesIngressConverter.applicationFormValuesToIngresses(formValues, service.Name);
        await Promise.all(this._generateIngressPatchPromises(formValues.OriginalIngresses, ingresses));
      }
    }

    const apiService = this._getApplicationApiService(app);

    if (app instanceof KubernetesStatefulSet) {
      app.VolumeClaims = claims;
      headlessService = await this.KubernetesServiceService.create(headlessService);
      app.ServiceName = headlessService.metadata.name;
    } else {
      const claimPromises = _.map(claims, (item) => {
        if (!item.PreviousName && !item.Id) {
          return this.KubernetesPersistentVolumeClaimService.create(item);
        }
      });
      await Promise.all(_.without(claimPromises, undefined));
    }

    if (formValues.AutoScaler.IsUsed && formValues.DeploymentType !== KubernetesApplicationDeploymentTypes.GLOBAL) {
      const kind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(app);
      const autoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(formValues, kind);
      await this.KubernetesHorizontalPodAutoScalerService.create(autoScaler);
    }

    await apiService.create(app);
  }

  create(formValues) {
    return this.$async(this.createAsync, formValues);
  }
  /* #endregion */

  /* #region  PATCH */
  // this function accepts KubernetesApplicationFormValues as parameters
  /**
   * NOTE: Keep this method flow in sync with `getUpdatedApplicationResources` method in the `applicationService` file
   *    To synchronise with kubernetes resource creation, update and delete summary output, any new resources created
   *    in this method should also be displayed in the summary output (getUpdatedApplicationResources)
   */
  async patchAsync(oldFormValues, newFormValues) {
    const [oldApp, oldHeadlessService, oldServices, oldService, oldClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(oldFormValues);
    const [newApp, newHeadlessService, newServices, newService, newClaims] = KubernetesApplicationConverter.applicationFormValuesToApplication(newFormValues);
    const oldApiService = this._getApplicationApiService(oldApp);
    const newApiService = this._getApplicationApiService(newApp);

    if (oldApiService !== newApiService) {
      await this.delete(oldApp);
      if (oldService) {
        await this.KubernetesServiceService.delete(oldService);
      }
      if (newService) {
        return '';
      }
      return await this.create(newFormValues);
    }

    if (newApp instanceof KubernetesStatefulSet) {
      await this.KubernetesServiceService.patch(oldHeadlessService, newHeadlessService);
    } else {
      const claimPromises = _.map(newClaims, (newClaim) => {
        if (!newClaim.PreviousName && !newClaim.Id) {
          return this.KubernetesPersistentVolumeClaimService.create(newClaim);
        } else if (!newClaim.Id) {
          const oldClaim = _.find(oldClaims, { Name: newClaim.PreviousName });
          return this.KubernetesPersistentVolumeClaimService.patch(oldClaim, newClaim);
        }
      });
      await Promise.all(claimPromises);
    }

    await newApiService.patch(oldApp, newApp);

    // Create services
    if (oldServices.length === 0 && newServices.length !== 0) {
      newServices.forEach(async (service) => {
        await this.KubernetesServiceService.create(service);
      });

      // Create multiple ingress
      const ingresses = KubernetesIngressConverter.generateNewIngresses(oldFormValues.OriginalIngresses, newServices);
      if (ingresses) {
        await Promise.all(this._generateIngressPatchPromises(oldFormValues.OriginalIngresses, ingresses));
      }
    }

    // Delete services ( only called when all services been deleted )
    if (oldServices.length !== 0 && newServices.length === 0) {
      const ingresses = KubernetesIngressConverter.removeIngressesPaths(oldFormValues.OriginalIngresses, oldServices);
      if (ingresses) {
        await Promise.all(this._generateIngressPatchPromises(oldFormValues.OriginalIngresses, ingresses));
      }
      await this.KubernetesServiceService.deleteAll(oldServices);
    }

    // Patch services ( Action including: Delete, Update, Create )
    if (oldServices.length !== 0 && newServices.length !== 0) {
      oldServices.forEach(async (oldService) => {
        const newServiceMatched = _.find(newServices, { Name: oldService.Name });
        if (!newServiceMatched) {
          await this.KubernetesServiceService.deleteSingle(oldService);
        }
      });

      newServices.forEach(async (newService) => {
        const oldServiceMatched = _.find(oldServices, { Name: newService.Name });
        if (oldServiceMatched) {
          await this.KubernetesServiceService.patch(oldServiceMatched, newService);
        } else {
          await this.KubernetesServiceService.create(newService);
        }
      });

      // Clear all ingress which is related to services in this application
      const clearIngress = KubernetesIngressConverter.removeIngressesPaths(oldFormValues.OriginalIngresses, oldServices);

      // Generate all ingress from services in this application
      const newIngress = KubernetesIngressConverter.generateNewIngresses(clearIngress, newServices);

      // Compare new ingress with old ingress to get api patch
      await Promise.all(this._generateIngressPatchPromises(oldFormValues.OriginalIngresses, newIngress));
    }

    const newKind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(newApp);
    const newAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(newFormValues, newKind);
    if (!oldFormValues.AutoScaler.IsUsed) {
      if (newFormValues.AutoScaler.IsUsed) {
        await this.KubernetesHorizontalPodAutoScalerService.create(newAutoScaler);
      }
    } else {
      const oldKind = KubernetesHorizontalPodAutoScalerHelper.getApplicationTypeString(oldApp);
      const oldAutoScaler = KubernetesHorizontalPodAutoScalerConverter.applicationFormValuesToModel(oldFormValues, oldKind);
      if (newFormValues.AutoScaler.IsUsed) {
        await this.KubernetesHorizontalPodAutoScalerService.patch(oldAutoScaler, newAutoScaler);
      } else {
        await this.KubernetesHorizontalPodAutoScalerService.delete(oldAutoScaler);
      }
    }
  }

  // this function accepts KubernetesApplication as parameters
  async patchPartialAsync(oldApp, newApp) {
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
  }

  // accept either formValues or applications as parameters depending on partial value
  // true = KubernetesApplication
  // false = KubernetesApplicationFormValues
  //
  // e.g. signatures are
  //
  // patch(oldValues: KubernetesApplication, newValues: KubernetesApplication, partial: (undefined | false)): Promise<unknown>
  // patch(oldValues: KubernetesApplicationFormValues, newValues: KubernetesApplicationFormValues, partial: true): Promise<unknown>
  patch(oldValues, newValues, partial = false) {
    if (partial) {
      return this.$async(this.patchPartialAsync, oldValues, newValues);
    }
    return this.$async(this.patchAsync, oldValues, newValues);
  }
  /* #endregion */

  /* #region  DELETE */
  async deleteAsync(application) {
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
    }

    if (application.ServiceType) {
      // delete headless service && non-headless service
      await this.KubernetesServiceService.delete(application.Services);

      if (application.Ingresses.length) {
        const originalIngresses = await this.KubernetesIngressService.get(payload.Namespace);
        const formValues = {
          OriginalIngresses: originalIngresses,
          PublishedPorts: KubernetesApplicationHelper.generatePublishedPortsFormValuesFromPublishedPorts(application.ServiceType, application.PublishedPorts),
        };
        const ingresses = KubernetesIngressConverter.applicationFormValuesToDeleteIngresses(formValues, application);

        await Promise.all(this._generateIngressPatchPromises(formValues.OriginalIngresses, ingresses));
      }
    }
    if (!_.isEmpty(application.AutoScaler)) {
      await this.KubernetesHorizontalPodAutoScalerService.delete(application.AutoScaler);
    }
  }

  delete(application) {
    return this.$async(this.deleteAsync, application);
  }
  /* #endregion */

  /* #region  ROLLBACK */
  async rollbackAsync(application, targetRevision) {
    const payload = KubernetesApplicationRollbackHelper.getPatchPayload(application, targetRevision);
    const apiService = this._getApplicationApiService(application);
    await apiService.rollback(application.ResourcePool, application.Name, payload);
  }

  rollback(application, targetRevision) {
    return this.$async(this.rollbackAsync, application, targetRevision);
  }
  /* #endregion */
}

export default KubernetesApplicationService;
angular.module('portainer.kubernetes').service('KubernetesApplicationService', KubernetesApplicationService);
