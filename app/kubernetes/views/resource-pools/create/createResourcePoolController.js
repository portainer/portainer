import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesResourcePoolFormValues, KubernetesResourcePoolIngressClassAnnotationFormValue } from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import { KubernetesIngressClassTypes } from 'Kubernetes/ingress/constants';
import KubernetesStorageClassConverter from 'Kubernetes/converters/storageClass';

class KubernetesCreateResourcePoolController {
  /* #region  CONSTRUCTOR */
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesNodeService, KubernetesResourcePoolService, KubernetesIngressService, Authentication, EndpointProvider) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.EndpointProvider = EndpointProvider;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesIngressService = KubernetesIngressService;

    this.IngressClassTypes = KubernetesIngressClassTypes;

    this.onInit = this.onInit.bind(this);
    this.createResourcePoolAsync = this.createResourcePoolAsync.bind(this);
    this.getResourcePoolsAsync = this.getResourcePoolsAsync.bind(this);
    this.getIngressesAsync = this.getIngressesAsync.bind(this);
  }
  /* #endregion */

  onChangeIngressHostname() {
    const state = this.state.duplicates.ingressHosts;

    const hosts = _.map(this.formValues.IngressClasses, 'Host');
    const allHosts = _.map(this.allIngresses, 'Host');
    const duplicates = KubernetesFormValidationHelper.getDuplicates(hosts);
    _.forEach(hosts, (host, idx) => {
      if (_.includes(allHosts, host) && host !== undefined) {
        duplicates[idx] = host;
      }
    });
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  /* #region  ANNOTATIONS MANAGEMENT */
  addAnnotation(ingressClass) {
    ingressClass.Annotations.push(new KubernetesResourcePoolIngressClassAnnotationFormValue());
  }

  removeAnnotation(ingressClass, index) {
    ingressClass.Annotations.splice(index, 1);
  }
  /* #endregion */

  isCreateButtonDisabled() {
    return this.state.actionInProgress || (this.formValues.HasQuota && !this.isQuotaValid()) || this.state.isAlreadyExist || this.state.duplicates.ingressHosts.hasRefs;
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

  /* #region  CREATE RESOURCE POOL */
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
  /* #endregion */

  /* #region  GET INGRESSES */
  async getIngressesAsync() {
    try {
      this.allIngresses = await this.KubernetesIngressService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve ingresses.');
    }
  }

  getIngresses() {
    return this.$async(this.getIngressesAsync);
  }
  /* #endregion */

  /* #region  GET RESOURCE POOLS */
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
  /* #endregion */

  /* #region  ON INIT */
  async onInit() {
    try {
      const endpoint = this.EndpointProvider.currentEndpoint();
      this.endpoint = endpoint;
      this.defaults = KubernetesResourceQuotaDefaults;
      this.formValues = new KubernetesResourcePoolFormValues(this.defaults);
      this.formValues.StorageClasses = KubernetesStorageClassConverter.storageClassesToResourcePoolFormValues(this.endpoint.Kubernetes.Configuration.StorageClasses);

      this.state = {
        actionInProgress: false,
        sliderMaxMemory: 0,
        sliderMaxCpu: 0,
        viewReady: false,
        isAlreadyExist: false,
        canUseIngress: endpoint.Kubernetes.Configuration.IngressClasses.length,
        duplicates: {
          ingressHosts: new KubernetesFormValidationReferences(),
        },
      };

      const nodes = await this.KubernetesNodeService.get();

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
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
  /* #endregion */
}

export default KubernetesCreateResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesCreateResourcePoolController', KubernetesCreateResourcePoolController);
