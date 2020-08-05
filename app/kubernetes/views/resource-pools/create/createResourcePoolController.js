import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourcePoolFormValues, KubernetesResourcePoolIngressClassFormValue } from 'Kubernetes/models/resource-pool/formValues';

class KubernetesCreateResourcePoolController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesNodeService, KubernetesResourcePoolService, Authentication, EndpointProvider) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.EndpointProvider = EndpointProvider;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.onInit = this.onInit.bind(this);
    this.createResourcePoolAsync = this.createResourcePoolAsync.bind(this);
    this.getResourcePoolsAsync = this.getResourcePoolsAsync.bind(this);
  }

  isValid() {
    return !this.state.isAlreadyExist;
  }

  onChangeName() {
    this.state.isAlreadyExist = _.find(this.resourcePools, (resourcePool) => resourcePool.Namespace.Name === this.formValues.Name) !== undefined;
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

  async createResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      const owner = this.Authentication.getUserDetails().username;
      this.formValues.Owner = owner;
      await this.KubernetesResourcePoolService.create(this.formValues);
      this.Notifications.success('Resource pool successfully created', this.formValues.Name);
      this.$state.go('kubernetes.resourcePools');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create resource pool');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createResourcePool() {
    return this.$async(this.createResourcePoolAsync);
  }

  async getResourcePoolsAsync() {
    try {
      this.resourcePools = await this.KubernetesResourcePoolService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve resource pools');
    }
  }

  getResourcePools() {
    return this.$async(this.getResourcePoolsAsync);
  }

  async onInit() {
    try {
      this.defaults = KubernetesResourceQuotaDefaults;
      this.formValues = new KubernetesResourcePoolFormValues(this.defaults);

      this.state = {
        actionInProgress: false,
        sliderMaxMemory: 0,
        sliderMaxCpu: 0,
        viewReady: false,
        isAlreadyExist: false,
        canUseIngress: this.EndpointProvider.currentEndpoint().Kubernetes.Configuration.UseIngress,
      };

      const nodes = await this.KubernetesNodeService.get();

      _.forEach(nodes, (item) => {
        this.state.sliderMaxMemory += filesizeParser(item.Memory);
        this.state.sliderMaxCpu += item.CPU;
      });
      this.state.sliderMaxMemory = KubernetesResourceReservationHelper.megaBytesValue(this.state.sliderMaxMemory);
      await this.getResourcePools();
      if (this.state.canUseIngress) {
        const ingressClasses = this.EndpointProvider.currentEndpoint().Kubernetes.Configuration.IngressClasses;
        this.formValues.IngressClasses = _.map(ingressClasses, (item) => new KubernetesResourcePoolIngressClassFormValue(item));
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesCreateResourcePoolController', KubernetesCreateResourcePoolController);
