import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resource-quota/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import {
  KubernetesResourcePoolFormValues,
  KubernetesResourcePoolIngressClassAnnotationFormValue,
  KubernetesResourcePoolIngressClassHostFormValue,
} from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesIngressConverter } from 'Kubernetes/ingress/converter';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import { KubernetesIngressClassTypes } from 'Kubernetes/ingress/constants';

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
    const hosts = _.flatMap(this.formValues.IngressClasses, 'Hosts');
    const hostnames = _.map(hosts, 'Host');
    const hostnamesWithoutRemoved = _.filter(hostnames, (h) => !h.NeedsDeletion);
    const allHosts = _.flatMap(this.allIngresses, 'Hosts');
    const formDuplicates = KubernetesFormValidationHelper.getDuplicates(hostnamesWithoutRemoved);
    _.forEach(hostnames, (host, idx) => {
      if (host !== undefined && _.includes(allHosts, host)) {
        formDuplicates[idx] = host;
      }
    });
    const duplicates = {};
    let count = 0;
    _.forEach(this.formValues.IngressClasses, (ic) => {
      duplicates[ic.IngressClass.Name] = {};
      _.forEach(ic.Hosts, (hostFV, hostIdx) => {
        if (hostFV.Host === formDuplicates[count]) {
          duplicates[ic.IngressClass.Name][hostIdx] = hostFV.Host;
        }
        count++;
      });
    });
    state.refs = duplicates;
    state.hasRefs = false;
    _.forIn(duplicates, (value) => {
      if (Object.keys(value).length > 0) {
        state.hasRefs = true;
      }
    });
  }

  addHostname(ingressClass) {
    ingressClass.Hosts.push(new KubernetesResourcePoolIngressClassHostFormValue());
  }

  removeHostname(ingressClass, index) {
    ingressClass.Hosts.splice(index, 1);
    this.onChangeIngressHostname();
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

  /* #region  CREATE NAMESPACE */
  async createResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      const owner = this.Authentication.getUserDetails().username;
      this.formValues.Owner = owner;
      await this.KubernetesResourcePoolService.create(this.formValues);
      this.Notifications.success('Namespace successfully created', this.formValues.Name);
      this.$state.go('kubernetes.resourcePools');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create namespace');
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

  /* #region  GET NAMESPACES */
  async getResourcePoolsAsync() {
    try {
      this.resourcePools = await this.KubernetesResourcePoolService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve namespaces');
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
      _.forEach(this.formValues.IngressClasses, (ic) => {
        if (ic.Hosts.length === 0) {
          ic.Hosts.push(new KubernetesResourcePoolIngressClassHostFormValue());
        }
      });
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
