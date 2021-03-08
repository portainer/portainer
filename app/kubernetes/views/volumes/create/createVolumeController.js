import angular from 'angular';
import * as _ from 'lodash-es';
import { KubernetesVolumeFormValues, KubernetesVolumeFormValuesDefaults } from 'Kubernetes/models/volume/formValues';

class KubernetesCreateVolumeController {
  /* @ngInject */
  constructor($async, $state, Notifications, Authentication, KubernetesNamespaceHelper, KubernetesResourcePoolService, KubernetesVolumeService, KubernetesPersistentVolumeService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesPersistentVolumeService = KubernetesPersistentVolumeService;
  }

  onNameChange() {
    const existingVolume = _.find(this.volumes, ['PersistentVolumeClaim.Name', this.formValues.Name]);
    this.state.alreadyExists = !!existingVolume;
  }

  refreshExistingVolumes() {
    return this.$async(async () => {
      try {
        this.volumes = await this.KubernetesVolumeService.get(this.formValues.ResourcePool.Namespace.Name);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to refresh volumes for this Resource Pool');
      }
    });
  }

  onResourcePoolSelectionChange() {
    return this.$async(async () => {
      await this.refreshExistingVolumes();
      this.onNameChange();
    });
  }

  createVolume() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        await this.KubernetesVolumeService.create(this.formValues);
        this.Notifications.success('Volume successfully created', this.formValues.Name);
        this.$state.go('kubernetes.volumes');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create volume');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.state = {
          viewReady: false,
          alreadyExists: false,
          actionInProgress: false,
        };
        const resourcePools = await this.KubernetesResourcePoolService.get();
        this.resourcePools = _.filter(resourcePools, (resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));

        this.formValues = new KubernetesVolumeFormValues();
        this.formValues.ApplicationOwner = this.Authentication.getUserDetails().username;
        this.formValues.Size = KubernetesVolumeFormValuesDefaults.Size;
        this.formValues.SizeUnit = KubernetesVolumeFormValuesDefaults.SizeUnit;

        this.formValues.ResourcePool = this.resourcePools[0];
        await this.onResourcePoolSelectionChange();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load view data');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
}

export default KubernetesCreateVolumeController;
angular.module('portainer.kubernetes').controller('KubernetesCreateVolumeController', KubernetesCreateVolumeController);
