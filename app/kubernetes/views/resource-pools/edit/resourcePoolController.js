import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults, KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';
import { KubernetesLimitRange } from 'Kubernetes/models/limit-range/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/kubernetesResourceReservationHelper';

function megaBytesValue(mem) {
  return Math.floor(mem / 1000 / 1000);
}

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

class KubernetesEditResourcePoolController {
  /* @ngInject */
  constructor($async, $state, $transition$, Authentication, Notifications, KubernetesNodeService, KubernetesResourceQuotaService, KubernetesResourcePoolService, KubernetesLimitRangeService, KubernetesEventService, KubernetesPodService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.Authentication = Authentication;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesLimitRangeService = KubernetesLimitRangeService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesEventService = KubernetesEventService;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.createResourceQuotaAsync = this.createResourceQuotaAsync.bind(this);
    this.createLimitRangeAsync = this.createLimitRangeAsync.bind(this);
    this.updateResourcePoolAsync = this.updateResourcePoolAsync.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getEventsAsync = this.getEventsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.getPodsAsync = this.getPodsAsync.bind(this);
    this.getPodsApplications = this.getPodsApplications.bind(this);
    this.getPodsApplicationsAsync = this.getPodsApplicationsAsync.bind(this);
  }

  isQuotaValid() {
    if (this.state.sliderMaxCpu < this.formValues.CpuLimit
      || this.state.sliderMaxMemory < this.formValues.MemoryLimit
      || (this.formValues.CpuLimit === 0 && this.formValues.MemoryLimit === 0)) {
      return false;
    }
    return true;
  }

  checkDefaults() {
    if (this.formValues.CpuLimit < this.defaults.CpuLimit) {
      this.formValues.CpuLimit = this.defaults.CpuLimit;
    }
    if (this.formValues.MemoryLimit < megaBytesValue(this.defaults.MemoryLimit)) {
      this.formValues.MemoryLimit = megaBytesValue(this.defaults.MemoryLimit);
    }
  }

  showEditor() {
    this.state.showEditorTab = true;
  }

  async createLimitRangeAsync(namespace, cpuLimit, memoryLimit) {
    const limitRange = new KubernetesLimitRange(namespace);
    limitRange.CPU = cpuLimit
    limitRange.Memory = memoryLimit;
    return await this.KubernetesLimitRangeService.create(limitRange);
  }

  async createResourceQuotaAsync(namespace, cpuLimit, memoryLimit) {
    const quota = new KubernetesResourceQuota(namespace);
    quota.CpuLimit = cpuLimit;
    quota.MemoryLimit = memoryLimit;
    await this.KubernetesResourceQuotaService.create(quota);
  }

  async updateResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      const namespace = this.pool.Namespace.Name;
      const cpuLimit = this.formValues.CpuLimit;
      const memoryLimit = bytesValue(this.formValues.MemoryLimit);
      const quota = this.pool.Quota;

      if (this.formValues.hasQuota) {
        if (quota) {
          quota.CpuLimit = cpuLimit;
          quota.MemoryLimit = memoryLimit;
          await this.KubernetesResourceQuotaService.update(quota);
          if (!this.pool.LimitRange) {
            await this.createLimitRangeAsync(namespace, cpuLimit, memoryLimit);
          }
        } else {
          await this.createResourceQuotaAsync(namespace, cpuLimit, memoryLimit);
          await this.createLimitRangeAsync(namespace, cpuLimit, memoryLimit);
        }
      } else if (quota) {
        await this.KubernetesResourceQuotaService.delete(quota);
        if (this.pool.LimitRange) {
          await this.KubernetesLimitRangeService.delete(this.pool.LimitRange);
        }
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
    return this.$async(this.updateResourcePoolAsync);
  }

  async getEventsAsync() {
    try {
      this.state.eventsLoading = true;
      this.events = await this.KubernetesEventService.get(this.pool.Namespace.Name);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve resource pool related events');
    } finally {
      this.state.eventsLoading = false;
    }
  }

  getEvents() {
    return this.$async(this.getEventsAsync);
  }

  async getPodsAsync() {
    try {
      this.state.podsLoading = true;
      this.pods = await this.KubernetesPodService.get(this.pool.Namespace.Name);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve pods.');
    } finally {
      this.state.podsLoading = false;
    }
  }

  getPods() {
    return this.$async(this.getPodsAsync);
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get(this.pool.Namespace.Name);
      this.applications = _.map(this.applications, app => {
        const pods = _.filter(this.pods, pod => Object.values(pod.Metadata.labels).includes(app.Name));
        const resourceReservation = KubernetesResourceReservationHelper.computeResourceReservation(pods);
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

  async getPodsApplicationsAsync() {
    await this.getPods();
    await this.getApplications();
  }

  getPodsApplications() {
    return this.$async(this.getPodsApplicationsAsync);
  }

  async onInit() {
    try {
      this.isAdmin = this.Authentication.isAdmin();
      this.defaults = KubernetesResourceQuotaDefaults;

      this.formValues = {
        MemoryLimit: this.defaults.MemoryLimit,
        CpuLimit: this.defaults.CpuLimit,
        hasQuota: false
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
        showEditorTab: false,
        eventsLoading: true,
        podsLoading: true,
        applicationsLoading: true
      };

      const name = this.$transition$.params().id;

      const [nodes, pool] = await Promise.all([
        this.KubernetesNodeService.get(),
        this.KubernetesResourcePoolService.get(name)
      ]);

      this.pool = pool;

      _.forEach(nodes, (item) => {
        this.state.sliderMaxMemory += filesizeParser(item.Memory);
        this.state.sliderMaxCpu += item.CPU;
      });
      this.state.sliderMaxMemory = megaBytesValue(this.state.sliderMaxMemory);

      const quota = pool.Quota;
      if (quota) {
        this.formValues.hasQuota = true;
        this.formValues.CpuLimit = quota.CpuLimit;
        this.formValues.MemoryLimit = megaBytesValue(quota.MemoryLimit);

        this.state.cpuUsed = quota.CpuLimitUsed;
        this.state.memoryUsed = megaBytesValue(quota.MemoryLimitUsed);
      }

      await this.getEvents();
      await this.getPodsApplications();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesEditResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesEditResourcePoolController', KubernetesEditResourcePoolController);
