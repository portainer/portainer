import angular from 'angular';
import * as _ from 'lodash-es';
import { KubernetesVolumeFormValues } from 'Kubernetes/models/volume/formValues';

class KubernetesCreateVolumeController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    Notifications,
    EndpointProvider,
    KubernetesNamespaceHelper,
    KubernetesResourcePoolService,
    Authentication,
    KubernetesVolumeService,
    KubernetesPVService
  ) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.Authentication = Authentication;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesPVService = KubernetesPVService;

    this.onInit = this.onInit.bind(this);
    this.createVolumeAsync = this.createVolumeAsync.bind(this);
  }

  onChangeName() {
    const existingVolume = _.find(this.volumes, { Name: this.formValues.Name });
    this.state.alreadyExists = (this.state.isEdit && existingVolume && this.application.Id !== existingVolume.Id) || (!this.state.isEdit && existingVolume);
  }

  onResourcePoolSelectionChange() {
    this.resetFormValues();
  }

  resetFormValues() {
    this.formValues = new KubernetesVolumeFormValues();

    if (this.storageClasses && this.storageClasses.length > 0) {
      this.formValues.StorageClass = this.storageClasses[0];
    }

    this.formValues.ResourcePool = this.resourcePools[0];
    this.formValues.SizeUnit = this.state.availableSizeUnits[0];
  }

  hasMultipleStorageClassesAvailable() {
    return this.storageClasses && this.storageClasses.length > 1;
  }

  isCreateButtonDisabled() {
    return !this.storageClasses || this.storageClasses.length === 0;
  }

  async createVolumeAsync() {
    this.state.actionInProgress = true;
    try {
      await this.KubernetesPVService.create(this.formValues);
      this.Notifications.success('Volume successfully created', this.formValues.Name);
      this.$state.go('kubernetes.volumes');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create volume');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createVolume() {
    return this.$async(this.createVolumeAsync);
  }

  async onInit() {
    try {
      this.state = {
        viewReady: false,
        availableSizeUnits: ['MB', 'GB', 'TB'],
        alreadyExists: false,
        actionInProgress: false,
      };
      const endpoint = this.EndpointProvider.currentEndpoint();
      this.endpoint = endpoint;
      this.isAdmin = this.Authentication.isAdmin();
      this.storageClasses = endpoint.Kubernetes.Configuration.StorageClasses;
      const resourcePools = await this.KubernetesResourcePoolService.get();
      this.resourcePools = _.filter(resourcePools, (resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));
      this.volumes = await this.KubernetesVolumeService.get();

      this.formValues = new KubernetesVolumeFormValues();

      if (this.storageClasses && this.storageClasses.length > 0) {
        this.formValues.StorageClass = this.storageClasses[0];
      }

      this.formValues.ResourcePool = this.resourcePools[0];
      this.formValues.SizeUnit = this.state.availableSizeUnits[0];
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

export default KubernetesCreateVolumeController;
angular.module('portainer.kubernetes').controller('KubernetesCreateVolumeController', KubernetesCreateVolumeController);
