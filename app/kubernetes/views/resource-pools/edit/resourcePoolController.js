import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults, KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import KubernetesEventHelper from 'Kubernetes/helpers/eventHelper';

class KubernetesResourcePoolController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    Authentication,
    Notifications,
    LocalStorage,
    KubernetesNodeService,
    KubernetesResourceQuotaService,
    KubernetesResourcePoolService,
    KubernetesEventService,
    KubernetesPodService,
    KubernetesApplicationService,
    KubernetesNamespaceHelper,
    ModalService
  ) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.LocalStorage = LocalStorage;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.ModalService = ModalService;

    this.onInit = this.onInit.bind(this);
    this.createResourceQuotaAsync = this.createResourceQuotaAsync.bind(this);
    this.updateResourcePoolAsync = this.updateResourcePoolAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('resourcePool', index);
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
    if (this.formValues.CpuLimit < this.defaults.CpuLimit) {
      this.formValues.CpuLimit = this.defaults.CpuLimit;
    }
    if (this.formValues.MemoryLimit < KubernetesResourceReservationHelper.megaBytesValue(this.defaults.MemoryLimit)) {
      this.formValues.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(this.defaults.MemoryLimit);
    }
  }

  showEditor() {
    this.state.showEditorTab = true;
    this.selectTab(2);
  }

  async createResourceQuotaAsync(namespace, owner, cpuLimit, memoryLimit) {
    const quota = new KubernetesResourceQuota(namespace);
    quota.CpuLimit = cpuLimit;
    quota.MemoryLimit = memoryLimit;
    quota.ResourcePoolName = namespace;
    quota.ResourcePoolOwner = owner;
    await this.KubernetesResourceQuotaService.create(quota);
  }

  hasResourceQuotaBeenReduce() {
    if (this.formValues.hasQuota) {
      const cpuLimit = this.formValues.CpuLimit;
      const memoryLimit = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);
      if (cpuLimit < this.oldQuota.CpuLimit || memoryLimit < this.oldQuota.MemoryLimit) {
        return true;
      }
    }
    return false;
  }

  async updateResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      const namespace = this.pool.Namespace.Name;
      const cpuLimit = this.formValues.CpuLimit;
      const memoryLimit = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);
      const owner = this.pool.Namespace.ResourcePoolOwner;
      const quota = this.pool.Quota;

      if (this.formValues.hasQuota) {
        if (quota) {
          quota.CpuLimit = cpuLimit;
          quota.MemoryLimit = memoryLimit;
          await this.KubernetesResourceQuotaService.update(quota);
        } else {
          await this.createResourceQuotaAsync(namespace, owner, cpuLimit, memoryLimit);
        }
      } else if (quota) {
        await this.KubernetesResourceQuotaService.delete(quota);
      }
      this.Notifications.success('Resource pool successfully updated', this.pool.Namespace.Name);
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create resource pool');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  updateResourcePool() {
    if (this.hasResourceQuotaBeenReduce()) {
      this.ModalService.confirmUpdate(
        'Reducing the quota assigned to an "in-use" resource pool may have unintended consequences, including preventing running applications from functioning correctly and potentially even blocking them from running at all.',
        (confirmed) => {
          if (confirmed) {
            return this.$async(this.updateResourcePoolAsync);
          }
        }
      );
    }
    return this.$async(this.updateResourcePoolAsync);
  }

  hasEventWarnings() {
    return this.state.eventWarningCount;
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      this.events = await this.KubernetesEventService.get(this.pool.Namespace.Name);
      this.state.eventWarningCount = KubernetesEventHelper.warningCount(this.events);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve resource pool related events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get(this.pool.Namespace.Name);
      this.applications = _.map(this.applications, (app) => {
        const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(app.Pods);
        app.CPU = resourceReservation.CPU;
        app.Memory = resourceReservation.Memory;
        return app;
      });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications.');
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    try {
      this.isAdmin = this.Authentication.isAdmin();
      this.defaults = KubernetesResourceQuotaDefaults;

      this.formValues = {
        MemoryLimit: this.defaults.MemoryLimit,
        CpuLimit: this.defaults.CpuLimit,
        hasQuota: false,
      };

      this.state = {
        actionInProgress: false,
        sliderMaxMemory: 0,
        sliderMaxCpu: 0,
        cpuUsage: 0,
        cpuUsed: 0,
        memoryUsage: 0,
        memoryUsed: 0,
        activeTab: 0,
        currentName: this.$state.$current.name,
        showEditorTab: false,
        eventsLoading: true,
        applicationsLoading: true,
        viewReady: false,
        eventWarningCount: 0,
      };

      this.state.activeTab = this.LocalStorage.getActiveTab('resourcePool');

      const name = this.$transition$.params().id;

      const [nodes, pool] = await Promise.all([this.KubernetesNodeService.get(), this.KubernetesResourcePoolService.get(name)]);

      this.pool = pool;

      _.forEach(nodes, (item) => {
        this.state.sliderMaxMemory += filesizeParser(item.Memory);
        this.state.sliderMaxCpu += item.CPU;
      });
      this.state.sliderMaxMemory = KubernetesResourceReservationHelper.megaBytesValue(this.state.sliderMaxMemory);

      const quota = pool.Quota;
      if (quota) {
        this.oldQuota = angular.copy(quota);
        this.formValues.hasQuota = true;
        this.formValues.CpuLimit = quota.CpuLimit;
        this.formValues.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(quota.MemoryLimit);

        this.state.cpuUsed = quota.CpuLimitUsed;
        this.state.memoryUsed = KubernetesResourceReservationHelper.megaBytesValue(quota.MemoryLimitUsed);
      }

      this.isEditable = !this.KubernetesNamespaceHelper.isSystemNamespace(this.pool.Namespace.Name);
      if (this.pool.Namespace.Name === 'default') {
        this.isEditable = false;
      }

      await this.getEvents();
      await this.getApplications();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('resourcePool', 0);
    }
  }
}

export default KubernetesResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesResourcePoolController', KubernetesResourcePoolController);
