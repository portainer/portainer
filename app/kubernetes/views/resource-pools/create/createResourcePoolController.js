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

import { FeatureId } from '@/portainer/feature-flags/enums';

class KubernetesCreateResourcePoolController {
  /* #region  CONSTRUCTOR */
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesNodeService, KubernetesResourcePoolService, KubernetesIngressService, Authentication, EndpointService) {
    Object.assign(this, {
      $async,
      $state,
      Notifications,
      KubernetesNodeService,
      KubernetesResourcePoolService,
      KubernetesIngressService,
      Authentication,
      EndpointService,
    });

    this.IngressClassTypes = KubernetesIngressClassTypes;
    this.LBQuotaFeatureId = FeatureId.K8S_RESOURCE_POOL_LB_QUOTA;
    this.StorageQuotaFeatureId = FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA;
  }
  /* #endregion */

  onChangeIngressHostname() {
    const state = this.state.duplicates.ingressHosts;
    const hosts = _.flatMap(this.formValues.IngressClasses, 'Hosts');
    const hostnames = _.compact(hosts.map((h) => h.Host));
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
  createResourcePool() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        this.checkDefaults();
        this.formValues.Owner = this.Authentication.getUserDetails().username;
        await this.KubernetesResourcePoolService.create(this.formValues);
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
        this.resourcePools = await this.KubernetesResourcePoolService.get();
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
        this.formValues.HasQuota = true;

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
          isAdmin: this.Authentication.isAdmin(),
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
