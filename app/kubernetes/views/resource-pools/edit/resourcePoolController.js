import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';

import { KubernetesResourcePoolFormValues, KubernetesResourcePoolIngressClassHostFormValue } from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import { KubernetesIngressClassTypes } from 'Kubernetes/ingress/constants';
import KubernetesResourceQuotaConverter from 'Kubernetes/converters/resourceQuota';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { updateIngressControllerClassMap, getIngressControllerClassMap } from '@/react/kubernetes/cluster/ingressClass/utils';
import { confirmUpdate } from '@@/modals/confirm';
import { confirmUpdateNamespace } from '@/react/kubernetes/namespaces/ItemView/ConfirmUpdateNamespace';
import { getMetricsForAllPods } from '@/react/kubernetes/services/service.ts';

class KubernetesResourcePoolController {
  /* #region  CONSTRUCTOR */
  /* @ngInject */
  constructor(
    $async,
    $state,
    $scope,
    Authentication,
    Notifications,
    LocalStorage,
    EndpointService,
    KubernetesResourceQuotaService,
    KubernetesResourcePoolService,
    KubernetesEventService,
    KubernetesPodService,
    KubernetesApplicationService,
    KubernetesIngressService,
    KubernetesVolumeService,
    KubernetesNamespaceService,
    KubernetesNodeService
  ) {
    Object.assign(this, {
      $async,
      $state,
      $scope,
      Authentication,
      Notifications,
      LocalStorage,
      EndpointService,
      KubernetesResourceQuotaService,
      KubernetesResourcePoolService,
      KubernetesEventService,
      KubernetesPodService,
      KubernetesApplicationService,
      KubernetesIngressService,
      KubernetesVolumeService,
      KubernetesNamespaceService,
      KubernetesNodeService,
    });

    this.IngressClassTypes = KubernetesIngressClassTypes;
    this.ResourceQuotaDefaults = KubernetesResourceQuotaDefaults;

    this.LBQuotaFeatureId = FeatureId.K8S_RESOURCE_POOL_LB_QUOTA;
    this.StorageQuotaFeatureId = FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA;

    this.updateResourcePoolAsync = this.updateResourcePoolAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.onToggleLoadBalancersQuota = this.onToggleLoadBalancersQuota.bind(this);
    this.onToggleStorageQuota = this.onToggleStorageQuota.bind(this);
    this.onChangeIngressControllerAvailability = this.onChangeIngressControllerAvailability.bind(this);
    this.onRegistriesChange = this.onRegistriesChange.bind(this);
    this.handleMemoryLimitChange = this.handleMemoryLimitChange.bind(this);
    this.handleCpuLimitChange = this.handleCpuLimitChange.bind(this);
  }
  /* #endregion */

  onRegistriesChange(registries) {
    return this.$scope.$evalAsync(() => {
      this.formValues.Registries = registries;
    });
  }

  onToggleLoadBalancersQuota(checked) {
    return this.$scope.$evalAsync(() => {
      this.formValues.UseLoadBalancersQuota = checked;
    });
  }

  onToggleStorageQuota(storageClassName, enabled) {
    this.$scope.$evalAsync(() => {
      this.formValues.StorageClasses = this.formValues.StorageClasses.map((sClass) => (sClass.Name !== storageClassName ? sClass : { ...sClass, Selected: enabled }));
    });
  }

  onChangeIngressControllerAvailability(controllerClassMap) {
    this.ingressControllers = controllerClassMap;
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('resourcePool', index);
  }

  isUpdateButtonDisabled() {
    return this.state.actionInProgress || (this.formValues.HasQuota && !this.isQuotaValid()) || this.state.duplicates.ingressHosts.hasRefs;
  }

  isQuotaValid() {
    if (
      this.state.sliderMaxCpu < this.formValues.CpuLimit ||
      this.state.sliderMaxMemory < this.formValues.MemoryLimit ||
      (this.formValues.CpuLimit === 0 && this.formValues.MemoryLimit === 0)
    ) {
      return false;
    }
    return true;
  }

  checkDefaults() {
    if (this.formValues.CpuLimit < KubernetesResourceQuotaDefaults.CpuLimit) {
      this.formValues.CpuLimit = KubernetesResourceQuotaDefaults.CpuLimit;
    }
    if (this.formValues.MemoryLimit < KubernetesResourceReservationHelper.megaBytesValue(KubernetesResourceQuotaDefaults.MemoryLimit)) {
      this.formValues.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(KubernetesResourceQuotaDefaults.MemoryLimit);
    }
  }

  handleMemoryLimitChange(memoryLimit) {
    return this.$async(async () => {
      this.formValues.MemoryLimit = memoryLimit;
    });
  }

  handleCpuLimitChange(cpuLimit) {
    return this.$async(async () => {
      this.formValues.CpuLimit = cpuLimit;
    });
  }

  showEditor() {
    this.state.showEditorTab = true;
    this.selectTab(2);
  }

  hasResourceQuotaBeenReduced() {
    if (this.formValues.HasQuota && this.oldQuota) {
      const cpuLimit = this.formValues.CpuLimit;
      const memoryLimit = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);
      if (cpuLimit < this.oldQuota.CpuLimit || memoryLimit < this.oldQuota.MemoryLimit) {
        return true;
      }
    }
    return false;
  }

  /* #region  UPDATE NAMESPACE */
  async updateResourcePoolAsync(oldFormValues, newFormValues) {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      await this.KubernetesResourcePoolService.patch(oldFormValues, newFormValues);
      await updateIngressControllerClassMap(this.endpoint.Id, this.ingressControllers || [], this.formValues.Name);
      this.Notifications.success('Namespace successfully updated', this.pool.Namespace.Name);
      this.$state.reload(this.$state.current);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create namespace');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  updateResourcePool() {
    const ingressesToDelete = _.filter(this.formValues.IngressClasses, { WasSelected: true, Selected: false });
    const registriesToDelete = _.filter(this.registries, { WasChecked: true, Checked: false });
    const warnings = {
      quota: this.hasResourceQuotaBeenReduced(),
      ingress: ingressesToDelete.length !== 0,
      registries: registriesToDelete.length !== 0,
    };

    if (warnings.quota || warnings.registries) {
      confirmUpdateNamespace(warnings.quota, warnings.ingress, warnings.registries).then((confirmed) => {
        if (confirmed) {
          return this.$async(this.updateResourcePoolAsync, this.savedFormValues, this.formValues);
        }
      });
    } else {
      return this.$async(this.updateResourcePoolAsync, this.savedFormValues, this.formValues);
    }
  }

  async confirmMarkUnmarkAsSystem() {
    const message = this.isSystem
      ? 'Unmarking this namespace as system will allow non administrator users to manage it and the resources in contains depending on the access control settings. Are you sure?'
      : 'Marking this namespace as a system namespace will prevent non administrator users from managing it and the resources it contains. Are you sure?';

    return new Promise((resolve) => {
      confirmUpdate(message, resolve);
    });
  }

  markUnmarkAsSystem() {
    return this.$async(async () => {
      try {
        const namespaceName = this.$state.params.id;
        this.state.actionInProgress = true;

        const confirmed = await this.confirmMarkUnmarkAsSystem();
        if (!confirmed) {
          return;
        }
        await this.KubernetesResourcePoolService.toggleSystem(this.endpoint.Id, namespaceName, !this.isSystem);

        this.Notifications.success('Namespace successfully updated', namespaceName);
        this.$state.reload(this.$state.current);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create namespace');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }
  /* #endregion */

  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  /* #region  GET EVENTS */
  getEvents() {
    return this.$async(async () => {
      try {
        this.state.eventsLoading = true;
        this.events = await this.KubernetesEventService.get(this.pool.Namespace.Name);
        this.state.eventWarningCount = KubernetesEventHelper.warningCount(this.events);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve namespace related events');
      } finally {
        this.state.eventsLoading = false;
      }
    });
  }
  /* #endregion */

  /* #region  GET APPLICATIONS */
  getApplications() {
    return this.$async(async () => {
      try {
        this.state.applicationsLoading = true;
        this.applications = await this.KubernetesApplicationService.get(this.pool.Namespace.Name);
        this.applications = _.map(this.applications, (app) => {
          const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(app.Pods);
          app.CPU = resourceReservation.CPU;
          app.Memory = resourceReservation.Memory;
          return app;
        });

        if (this.state.useServerMetrics) {
          await this.getResourceUsage(this.pool.Namespace.Name);
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve applications.');
      } finally {
        this.state.applicationsLoading = false;
      }
    });
  }
  /* #endregion */

  /* #region  GET INGRESSES */
  getIngresses() {
    return this.$async(async () => {
      this.state.ingressesLoading = true;
      try {
        const namespace = this.pool.Namespace.Name;
        this.allIngresses = await this.KubernetesIngressService.get(this.state.hasWriteAuthorization ? '' : namespace);
        this.ingresses = _.filter(this.allIngresses, { Namespace: namespace });
        _.forEach(this.ingresses, (ing) => {
          ing.Namespace = namespace;
          _.forEach(ing.Paths, (path) => {
            const application = _.find(this.applications, { ServiceName: path.ServiceName });
            path.ApplicationName = application && application.Name ? application.Name : '-';
          });
        });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve ingresses.');
      } finally {
        this.state.ingressesLoading = false;
      }
    });
  }
  /* #endregion */

  /* #region  GET REGISTRIES */
  getRegistries() {
    return this.$async(async () => {
      try {
        const namespace = this.$state.params.id;

        if (this.isAdmin) {
          this.registries = await this.EndpointService.registries(this.endpoint.Id);
          this.registries.forEach((reg) => {
            if (reg.RegistryAccesses && reg.RegistryAccesses[this.endpoint.Id] && reg.RegistryAccesses[this.endpoint.Id].Namespaces.includes(namespace)) {
              reg.Checked = true;
              reg.WasChecked = true;
              this.formValues.Registries.push(reg);
            }
          });
          this.selectedRegistries = this.formValues.Registries.map((r) => r.Name).join(', ');
          return;
        }

        const registries = await this.EndpointService.registries(this.endpoint.Id, namespace);
        this.selectedRegistries = registries.map((r) => r.Name).join(', ');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      }
    });
  }
  /* #endregion */

  async getResourceUsage(namespace) {
    try {
      const namespaceMetrics = await getMetricsForAllPods(this.$state.params.endpointId, namespace);
      // extract resource usage of all containers within each pod of the namespace
      const containerResourceUsageList = namespaceMetrics.items.flatMap((i) => i.containers.map((c) => c.usage));
      const namespaceResourceUsage = containerResourceUsageList.reduce((total, u) => {
        total.CPU += KubernetesResourceReservationHelper.parseCPU(u.cpu);
        total.Memory += KubernetesResourceReservationHelper.megaBytesValue(u.memory);
        return total;
      }, new KubernetesResourceReservation());
      this.state.resourceUsage = namespaceResourceUsage;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve namespace resource usage');
    }
  }

  /* #region  ON INIT */
  $onInit() {
    return this.$async(async () => {
      try {
        this.isAdmin = this.Authentication.isAdmin();

        this.state = {
          actionInProgress: false,
          sliderMaxMemory: 0,
          sliderMaxCpu: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          resourceReservation: { CPU: 0, Memory: 0 },
          activeTab: 0,
          currentName: this.$state.$current.name,
          showEditorTab: false,
          eventsLoading: true,
          applicationsLoading: true,
          ingressesLoading: true,
          viewReady: false,
          eventWarningCount: 0,
          canUseIngress: false,
          useServerMetrics: this.endpoint.Kubernetes.Configuration.UseServerMetrics,
          duplicates: {
            ingressHosts: new KubernetesFormValidationReferences(),
          },
          ingressAvailabilityPerNamespace: this.endpoint.Kubernetes.Configuration.IngressAvailabilityPerNamespace,
        };

        this.state.activeTab = this.LocalStorage.getActiveTab('resourcePool');

        const name = this.$state.params.id;

        const [nodes, pools] = await Promise.all([this.KubernetesNodeService.get(), this.KubernetesResourcePoolService.get('', { getQuota: true })]);

        this.ingressControllers = [];
        if (this.state.ingressAvailabilityPerNamespace) {
          this.ingressControllers = await getIngressControllerClassMap({ environmentId: this.endpoint.Id, namespace: name });
        }

        this.pool = _.find(pools, { Namespace: { Name: name } });
        this.formValues = new KubernetesResourcePoolFormValues(KubernetesResourceQuotaDefaults);
        this.formValues.Name = this.pool.Namespace.Name;
        this.formValues.EndpointId = this.endpoint.Id;
        this.formValues.IsSystem = this.pool.Namespace.IsSystem;

        _.forEach(nodes, (item) => {
          this.state.sliderMaxMemory += filesizeParser(item.Memory);
          this.state.sliderMaxCpu += item.CPU;
        });
        this.state.sliderMaxMemory = KubernetesResourceReservationHelper.megaBytesValue(this.state.sliderMaxMemory);

        const quota = this.pool.Quota;
        if (quota) {
          this.oldQuota = angular.copy(quota);
          this.formValues = KubernetesResourceQuotaConverter.quotaToResourcePoolFormValues(quota);
          this.formValues.EndpointId = this.endpoint.Id;

          this.state.resourceReservation.CPU = quota.CpuLimitUsed;
          this.state.resourceReservation.Memory = KubernetesResourceReservationHelper.megaBytesValue(quota.MemoryLimitUsed);
        }
        this.isSystem = KubernetesNamespaceHelper.isSystemNamespace(this.pool.Namespace.Name);
        this.isDefaultNamespace = KubernetesNamespaceHelper.isDefaultNamespace(this.pool.Namespace.Name);
        this.isEditable = !this.isSystem && !this.isDefaultNamespace;

        await this.getEvents();
        await this.getApplications();

        if (this.state.canUseIngress) {
          await this.getIngresses();
          const ingressClasses = this.endpoint.Kubernetes.Configuration.IngressClasses;
          this.formValues.IngressClasses = KubernetesIngressConverter.ingressClassesToFormValues(ingressClasses, this.ingresses);
          _.forEach(this.formValues.IngressClasses, (ic) => {
            if (ic.Hosts.length === 0) {
              ic.Hosts.push(new KubernetesResourcePoolIngressClassHostFormValue());
            }
          });
        }

        await this.getRegistries();

        this.savedFormValues = angular.copy(this.formValues);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load view data');
      } finally {
        this.state.viewReady = true;
      }
    });
  }

  /* #endregion */

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('resourcePool', 0);
    }
  }
}

export default KubernetesResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesResourcePoolController', KubernetesResourcePoolController);
