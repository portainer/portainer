import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourcePoolFormValues, KubernetesResourcePoolIngressClassHostFormValue } from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import { KubernetesIngressClassTypes } from 'Kubernetes/ingress/constants';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { getIngressControllerClassMap, updateIngressControllerClassMap } from '@/react/kubernetes/cluster/ingressClass/utils';

class KubernetesCreateResourcePoolController {
  /* #region  CONSTRUCTOR */
  /* @ngInject */
  constructor($async, $state, $scope, Notifications, KubernetesNodeService, KubernetesResourcePoolService, KubernetesIngressService, Authentication, EndpointService) {
    Object.assign(this, {
      $async,
      $state,
      $scope,
      Notifications,
      KubernetesNodeService,
      KubernetesResourcePoolService,
      KubernetesIngressService,
      Authentication,
      EndpointService,
    });

    this.IngressClassTypes = KubernetesIngressClassTypes;
    this.LBQuotaFeatureId = FeatureId.K8S_RESOURCE_POOL_LB_QUOTA;

    this.onToggleStorageQuota = this.onToggleStorageQuota.bind(this);
    this.onToggleLoadBalancerQuota = this.onToggleLoadBalancerQuota.bind(this);
    this.onToggleResourceQuota = this.onToggleResourceQuota.bind(this);
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

  onToggleStorageQuota(storageClassName, enabled) {
    this.$scope.$evalAsync(() => {
      this.formValues.StorageClasses = this.formValues.StorageClasses.map((sClass) => (sClass.Name !== storageClassName ? sClass : { ...sClass, Selected: enabled }));
    });
  }

  onToggleLoadBalancerQuota(enabled) {
    this.$scope.$evalAsync(() => {
      this.formValues.UseLoadBalancersQuota = enabled;
    });
  }

  onToggleResourceQuota(enabled) {
    this.$scope.$evalAsync(() => {
      this.formValues.HasQuota = enabled;
    });
  }

  /* #region  INGRESS MANAGEMENT */
  onChangeIngressControllerAvailability(controllerClassMap) {
    this.ingressControllers = controllerClassMap;
  }
  /* #endregion */

  isCreateButtonDisabled() {
    return (
      this.state.actionInProgress ||
      (this.formValues.HasQuota && !this.isQuotaValid()) ||
      this.state.isAlreadyExist ||
      this.state.hasPrefixKube ||
      this.state.duplicates.ingressHosts.hasRefs
    );
  }

  onChangeName() {
    this.state.isAlreadyExist = _.find(this.resourcePools, (resourcePool) => resourcePool.Namespace.Name === this.formValues.Name) !== undefined;
    this.state.hasPrefixKube = /^kube-/.test(this.formValues.Name);
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

  /* #region  CREATE NAMESPACE */
  createResourcePool() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        this.checkDefaults();
        this.formValues.Owner = this.Authentication.getUserDetails().username;
        await this.KubernetesResourcePoolService.create(this.formValues);
        await updateIngressControllerClassMap(this.endpoint.Id, this.ingressControllers || [], this.formValues.Name);
        this.Notifications.success('Namespace successfully created', this.formValues.Name);
        this.$state.go('kubernetes.resourcePools');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create namespace');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }
  /* #endregion */

  /* #region  GET INGRESSES */
  getIngresses() {
    return this.$async(async () => {
      try {
        this.allIngresses = await this.KubernetesIngressService.get();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve ingresses.');
      }
    });
  }
  /* #endregion */

  /* #region  GET NAMESPACES */
  getResourcePools() {
    return this.$async(async () => {
      try {
        this.resourcePools = await this.KubernetesResourcePoolService.get('', { getQuota: true });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve namespaces');
      }
    });
  }
  /* #endregion */

  /* #region  GET REGISTRIES */
  getRegistries() {
    return this.$async(async () => {
      try {
        this.registries = await this.EndpointService.registries(this.endpoint.Id);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      }
    });
  }
  /* #endregion */

  /* #region  ON INIT */
  $onInit() {
    return this.$async(async () => {
      try {
        const endpoint = this.endpoint;
        this.defaults = KubernetesResourceQuotaDefaults;
        this.formValues = new KubernetesResourcePoolFormValues(this.defaults);
        this.formValues.EndpointId = this.endpoint.Id;
        this.formValues.HasQuota = false;

        this.state = {
          actionInProgress: false,
          sliderMaxMemory: 0,
          sliderMaxCpu: 0,
          viewReady: false,
          isAlreadyExist: false,
          hasPrefixKube: false,
          canUseIngress: false,
          duplicates: {
            ingressHosts: new KubernetesFormValidationReferences(),
          },
          isAdmin: this.Authentication.isAdmin(),
          ingressAvailabilityPerNamespace: endpoint.Kubernetes.Configuration.IngressAvailabilityPerNamespace,
        };

        const nodes = await this.KubernetesNodeService.get();

        this.ingressControllers = [];
        if (this.state.ingressAvailabilityPerNamespace) {
          this.ingressControllers = await getIngressControllerClassMap({ environmentId: this.endpoint.Id, allowedOnly: true });
        }

        _.forEach(nodes, (item) => {
          this.state.sliderMaxMemory += filesizeParser(item.Memory);
          this.state.sliderMaxCpu += item.CPU;
        });
        this.state.sliderMaxMemory = KubernetesResourceReservationHelper.megaBytesValue(this.state.sliderMaxMemory);
        await this.getResourcePools();
        if (this.state.canUseIngress) {
          await this.getIngresses();
          const ingressClasses = endpoint.Kubernetes.Configuration.IngressClasses;
          this.formValues.IngressClasses = KubernetesIngressConverter.ingressClassesToFormValues(ingressClasses);
        }
        _.forEach(this.formValues.IngressClasses, (ic) => {
          if (ic.Hosts.length === 0) {
            ic.Hosts.push(new KubernetesResourcePoolIngressClassHostFormValue());
          }
        });

        await this.getRegistries();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load view data');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
  /* #endregion */
}

export default KubernetesCreateResourcePoolController;
