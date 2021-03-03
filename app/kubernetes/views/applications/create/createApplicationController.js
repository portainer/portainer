import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import * as JsonPatch from 'fast-json-patch';

import {
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationQuotaDefaults,
  KubernetesApplicationTypes,
  KubernetesApplicationPlacementTypes,
} from 'Kubernetes/models/application/models';
import {
  KubernetesApplicationConfigurationFormValue,
  KubernetesApplicationConfigurationFormValueOverridenKey,
  KubernetesApplicationConfigurationFormValueOverridenKeyTypes,
  KubernetesApplicationEnvironmentVariableFormValue,
  KubernetesApplicationFormValues,
  KubernetesApplicationPersistedFolderFormValue,
  KubernetesApplicationPublishedPortFormValue,
  KubernetesApplicationPlacementFormValue,
  KubernetesFormValidationReferences,
} from 'Kubernetes/models/application/formValues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application/index';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';
import { KubernetesNodeHelper } from 'Kubernetes/node/helper';

class KubernetesCreateApplicationController {
  /* #region  CONSTRUCTOR */

  /* @ngInject */
  constructor(
    $async,
    $state,
    Notifications,
    EndpointProvider,
    Authentication,
    ModalService,
    KubernetesResourcePoolService,
    KubernetesApplicationService,
    KubernetesStackService,
    KubernetesConfigurationService,
    KubernetesNodeService,
    KubernetesIngressService,
    KubernetesPersistentVolumeClaimService,
    KubernetesNamespaceHelper,
    KubernetesVolumeService
  ) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.Authentication = Authentication;
    this.ModalService = ModalService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesStackService = KubernetesStackService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesVolumeService = KubernetesVolumeService;
    this.KubernetesIngressService = KubernetesIngressService;
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.ApplicationPublishingTypes = KubernetesApplicationPublishingTypes;
    this.ApplicationPlacementTypes = KubernetesApplicationPlacementTypes;
    this.ApplicationTypes = KubernetesApplicationTypes;
    this.ApplicationConfigurationFormValueOverridenKeyTypes = KubernetesApplicationConfigurationFormValueOverridenKeyTypes;
    this.ServiceTypes = KubernetesServiceTypes;

    this.updateApplicationAsync = this.updateApplicationAsync.bind(this);
    this.deployApplicationAsync = this.deployApplicationAsync.bind(this);
  }
  /* #endregion */

  onChangeName() {
    const existingApplication = _.find(this.applications, { Name: this.formValues.Name });
    this.state.alreadyExists = (this.state.isEdit && existingApplication && this.application.Id !== existingApplication.Id) || (!this.state.isEdit && existingApplication);
  }

  /* #region  AUTO SCALER UI MANAGEMENT */
  unselectAutoScaler() {
    if (this.formValues.DeploymentType === this.ApplicationDeploymentTypes.GLOBAL) {
      this.formValues.AutoScaler.IsUsed = false;
    }
  }
  /* #endregion */

  /* #region  CONFIGURATION UI MANAGEMENT */
  addConfiguration() {
    let config = new KubernetesApplicationConfigurationFormValue();
    config.SelectedConfiguration = this.configurations[0];
    this.formValues.Configurations.push(config);
  }

  removeConfiguration(index) {
    this.formValues.Configurations.splice(index, 1);
    this.onChangeConfigurationPath();
  }

  overrideConfiguration(index) {
    const config = this.formValues.Configurations[index];
    config.Overriden = true;
    config.OverridenKeys = _.map(_.keys(config.SelectedConfiguration.Data), (key) => {
      const res = new KubernetesApplicationConfigurationFormValueOverridenKey();
      res.Key = key;
      return res;
    });
  }

  resetConfiguration(index) {
    const config = this.formValues.Configurations[index];
    config.Overriden = false;
    config.OverridenKeys = [];
    this.onChangeConfigurationPath();
  }

  clearConfigurations() {
    this.formValues.Configurations = [];
  }

  onChangeConfigurationPath() {
    this.state.duplicates.configurationPaths.refs = [];

    const paths = _.reduce(
      this.formValues.Configurations,
      (result, config) => {
        const uniqOverridenKeysPath = _.uniq(_.map(config.OverridenKeys, 'Path'));
        return _.concat(result, uniqOverridenKeysPath);
      },
      []
    );

    const duplicatePaths = KubernetesFormValidationHelper.getDuplicates(paths);

    _.forEach(this.formValues.Configurations, (config, index) => {
      _.forEach(config.OverridenKeys, (overridenKey, keyIndex) => {
        const findPath = _.find(duplicatePaths, (path) => path === overridenKey.Path);
        if (findPath) {
          this.state.duplicates.configurationPaths.refs[index + '_' + keyIndex] = findPath;
        }
      });
    });

    this.state.duplicates.configurationPaths.hasRefs = Object.keys(this.state.duplicates.configurationPaths.refs).length > 0;
  }
  /* #endregion */

  /* #region  ENVIRONMENT UI MANAGEMENT */
  addEnvironmentVariable() {
    this.formValues.EnvironmentVariables.push(new KubernetesApplicationEnvironmentVariableFormValue());
  }

  restoreEnvironmentVariable(index) {
    this.formValues.EnvironmentVariables[index].NeedsDeletion = false;
  }

  removeEnvironmentVariable(index) {
    if (this.state.isEdit && !this.formValues.EnvironmentVariables[index].IsNew) {
      this.formValues.EnvironmentVariables[index].NeedsDeletion = true;
    } else {
      this.formValues.EnvironmentVariables.splice(index, 1);
    }
    this.onChangeEnvironmentName();
  }

  onChangeEnvironmentName() {
    this.state.duplicates.environmentVariables.refs = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.EnvironmentVariables, 'Name'));
    this.state.duplicates.environmentVariables.hasRefs = Object.keys(this.state.duplicates.environmentVariables.refs).length > 0;
  }
  /* #endregion */

  /* #region  PERSISTENT FOLDERS UI MANAGEMENT */
  addPersistedFolder() {
    let storageClass = {};
    if (this.storageClasses.length > 0) {
      storageClass = this.storageClasses[0];
    }

    const newPf = new KubernetesApplicationPersistedFolderFormValue(storageClass);
    if (this.allQuotasExhaustedAndVolumesAvailable()) {
      newPf.UseNewVolume = false;
    }
    this.formValues.PersistedFolders.push(newPf);
    this.resetDeploymentType();
  }

  restorePersistedFolder(index) {
    this.formValues.PersistedFolders[index].NeedsDeletion = false;
    this.validatePersistedFolders();
  }

  resetPersistedFolders() {
    if (this.allQuotasExhaustedAndNoVolumesAvailable()) {
      this.formValues.PersistedFolders = [];
    } else {
      _.forEach(this.formValues.PersistedFolders, (persistedFolder) => {
        persistedFolder.ExistingVolume = null;
        persistedFolder.UseNewVolume = this.allQuotasExhaustedAndVolumesAvailable() ? false : true;
      });
      this.validatePersistedFolders();
    }
  }

  removePersistedFolder(index) {
    if (this.state.isEdit && this.formValues.PersistedFolders[index].PersistentVolumeClaimName) {
      this.formValues.PersistedFolders[index].NeedsDeletion = true;
    } else {
      this.formValues.PersistedFolders.splice(index, 1);
    }
    this.validatePersistedFolders();
  }

  useNewVolume(index) {
    this.formValues.PersistedFolders[index].UseNewVolume = true;
    this.formValues.PersistedFolders[index].ExistingVolume = null;
    this.state.persistedFoldersUseExistingVolumes = !_.reduce(this.formValues.PersistedFolders, (acc, pf) => acc && pf.UseNewVolume, true);
    this.validatePersistedFolders();
  }

  useExistingVolume(index) {
    this.formValues.PersistedFolders[index].UseNewVolume = false;
    this.state.persistedFoldersUseExistingVolumes = _.find(this.formValues.PersistedFolders, { UseNewVolume: false }) ? true : false;
    if (this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED) {
      this.formValues.DataAccessPolicy = this.ApplicationDataAccessPolicies.SHARED;
      this.resetDeploymentType();
    }
    this.validatePersistedFolders();
  }
  /* #endregion */

  /* #region  PERSISTENT FOLDERS ON CHANGE VALIDATION */
  validatePersistedFolders() {
    this.onChangePersistedFolderPath();
    this.onChangeVolumeRequestedSize();
    this.onChangeExistingVolumeSelection();
  }

  onChangePersistedFolderPath() {
    this.state.duplicates.persistedFolders.refs = KubernetesFormValidationHelper.getDuplicates(
      _.map(this.formValues.PersistedFolders, (persistedFolder) => {
        if (persistedFolder.NeedsDeletion) {
          return undefined;
        }
        return persistedFolder.ContainerPath;
      })
    );
    this.state.duplicates.persistedFolders.hasRefs = Object.keys(this.state.duplicates.persistedFolders.refs).length > 0;
  }

  onChangeVolumeRequestedSize() {
    const quota = this.formValues.ResourcePool.Quota;
    this.state.storages.quotaExceeded = false;
    if (quota) {
      const pfs = this.formValues.PersistedFolders;
      const groups = _.groupBy(pfs, 'StorageClass.Name');
      const res = {};
      _.forOwn(groups, (storagePfs, storageClassName) => {
        const newPfs = _.filter(storagePfs, { PersistentVolumeClaimName: '' });
        const requestedSize = _.reduce(newPfs, (sum, pf) => (pf.UseNewVolume && pf.Size ? sum + filesizeParser(`${pf.Size}${pf.SizeUnit}`, { base: 10 }) : sum), 0);
        if (this.state.storages.availabilities[storageClassName] < requestedSize) {
          _.forEach(pfs, (pf, idx) => {
            if (_.includes(newPfs, pf) && pf.UseNewVolume && pf.Size) {
              res[idx] = true;
            }
          });
        }
        if (
          this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED &&
          this.state.storages.availabilities[storageClassName] < requestedSize * this.formValues.ReplicaCount
        ) {
          this.state.storages.quotaExceeded = true;
        }
      });
      this.state.exceeded.persistedFolders.refs = res;
      this.state.exceeded.persistedFolders.hasRefs = Object.keys(this.state.exceeded.persistedFolders.refs).length > 0;
    }
  }

  onChangeExistingVolumeSelection() {
    this.state.duplicates.existingVolumes.refs = KubernetesFormValidationHelper.getDuplicates(
      _.map(this.formValues.PersistedFolders, (persistedFolder) => {
        if (persistedFolder.NeedsDeletion) {
          return undefined;
        }
        return persistedFolder.ExistingVolume ? persistedFolder.ExistingVolume.PersistentVolumeClaim.Name : '';
      })
    );
    this.state.duplicates.existingVolumes.hasRefs = Object.keys(this.state.duplicates.existingVolumes.refs).length > 0;
  }
  /* #endregion */

  /* #region  PLACEMENT UI MANAGEMENT */
  addPlacement() {
    const placement = new KubernetesApplicationPlacementFormValue();
    const label = this.nodesLabels[0];
    placement.Label = label;
    placement.Value = label.Values[0];
    this.formValues.Placements.push(placement);
    this.onChangePlacement();
  }

  restorePlacement(index) {
    this.formValues.Placements[index].NeedsDeletion = false;
    this.onChangePlacement();
  }

  removePlacement(index) {
    if (this.state.isEdit && !this.formValues.Placements[index].IsNew) {
      this.formValues.Placements[index].NeedsDeletion = true;
    } else {
      this.formValues.Placements.splice(index, 1);
    }
    this.onChangePlacement();
  }

  // call all validation functions when a placement is added/removed/restored
  onChangePlacement() {
    this.onChangePlacementLabelValidate();
  }

  onChangePlacementLabel(index) {
    this.formValues.Placements[index].Value = this.formValues.Placements[index].Label.Values[0];
    this.onChangePlacementLabelValidate();
  }

  onChangePlacementLabelValidate() {
    const state = this.state.duplicates.placements;
    const source = _.map(this.formValues.Placements, (p) => (p.NeedsDeletion ? undefined : p.Label.Key));
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  /* #endregion */

  /* #region  PUBLISHED PORTS UI MANAGEMENT */
  addPublishedPort() {
    const p = new KubernetesApplicationPublishedPortFormValue();
    const ingresses = this.filteredIngresses;
    p.IngressName = ingresses && ingresses.length ? ingresses[0].Name : undefined;
    p.IngressHost = ingresses && ingresses.length ? ingresses[0].Host : undefined;
    if (this.formValues.PublishedPorts.length) {
      p.Protocol = this.formValues.PublishedPorts[0].Protocol;
    }
    this.formValues.PublishedPorts.push(p);
  }

  resetPublishedPorts() {
    const ingresses = this.filteredIngresses;
    _.forEach(this.formValues.PublishedPorts, (p) => {
      p.IngressName = ingresses && ingresses.length ? ingresses[0].Name : undefined;
      p.IngressHost = ingresses && ingresses.length ? ingresses[0].Host : undefined;
    });
  }

  restorePublishedPort(index) {
    this.formValues.PublishedPorts[index].NeedsDeletion = false;
    this.onChangePublishedPorts();
  }

  removePublishedPort(index) {
    if (this.state.isEdit && !this.formValues.PublishedPorts[index].IsNew) {
      this.formValues.PublishedPorts[index].NeedsDeletion = true;
    } else {
      this.formValues.PublishedPorts.splice(index, 1);
    }
    this.onChangePublishedPorts();
  }
  /* #endregion */

  /* #region  PUBLISHED PORTS ON CHANGE VALIDATION */
  onChangePublishedPorts() {
    this.onChangePortMappingContainerPort();
    this.onChangePortMappingNodePort();
    this.onChangePortMappingIngressRoute();
    this.onChangePortMappingLoadBalancer();
    this.onChangePortProtocol();
  }

  onChangePortMappingContainerPort() {
    const state = this.state.duplicates.publishedPorts.containerPorts;
    if (this.formValues.PublishingType !== KubernetesApplicationPublishingTypes.INGRESS) {
      const source = _.map(this.formValues.PublishedPorts, (p) => (p.NeedsDeletion ? undefined : p.ContainerPort + p.Protocol));
      const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
      state.refs = duplicates;
      state.hasRefs = Object.keys(duplicates).length > 0;
    } else {
      state.refs = {};
      state.hasRefs = false;
    }
  }

  onChangePortMappingNodePort() {
    const state = this.state.duplicates.publishedPorts.nodePorts;
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.CLUSTER) {
      const source = _.map(this.formValues.PublishedPorts, (p) => (p.NeedsDeletion ? undefined : p.NodePort));
      const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
      state.refs = duplicates;
      state.hasRefs = Object.keys(duplicates).length > 0;
    } else {
      state.refs = {};
      state.hasRefs = false;
    }
  }

  onChangePortMappingIngress(index) {
    const publishedPort = this.formValues.PublishedPorts[index];
    const ingress = _.find(this.filteredIngresses, { Name: publishedPort.IngressName });
    publishedPort.IngressHost = ingress.Host;
    this.onChangePublishedPorts();
  }

  onChangePortMappingIngressRoute() {
    const state = this.state.duplicates.publishedPorts.ingressRoutes;

    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      const newRoutes = _.map(this.formValues.PublishedPorts, (p) => (p.IsNew && p.IngressRoute ? `${p.IngressHost || p.IngressName}${p.IngressRoute}` : undefined));
      const toDelRoutes = _.map(this.formValues.PublishedPorts, (p) => (p.NeedsDeletion && p.IngressRoute ? `${p.IngressHost || p.IngressName}${p.IngressRoute}` : undefined));
      const allRoutes = _.flatMap(this.ingresses, (i) => _.map(i.Paths, (p) => `${p.Host || i.Name}${p.Path}`));
      const duplicates = KubernetesFormValidationHelper.getDuplicates(newRoutes);
      _.forEach(newRoutes, (route, idx) => {
        if (_.includes(allRoutes, route) && !_.includes(toDelRoutes, route)) {
          duplicates[idx] = route;
        }
      });
      state.refs = duplicates;
      state.hasRefs = Object.keys(duplicates).length > 0;
    } else {
      state.refs = {};
      state.hasRefs = false;
    }
  }

  onChangePortMappingLoadBalancer() {
    const state = this.state.duplicates.publishedPorts.loadBalancerPorts;
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
      const source = _.map(this.formValues.PublishedPorts, (p) => (p.NeedsDeletion ? undefined : p.LoadBalancerPort));
      const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
      state.refs = duplicates;
      state.hasRefs = Object.keys(duplicates).length > 0;
    } else {
      state.refs = {};
      state.hasRefs = false;
    }
  }

  onChangePortProtocol(index) {
    this.onChangePortMappingContainerPort();
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
      const newPorts = _.filter(this.formValues.PublishedPorts, { IsNew: true });
      _.forEach(newPorts, (port) => {
        port.Protocol = index ? this.formValues.PublishedPorts[index].Protocol : newPorts[0].Protocol;
      });
    }
  }
  /* #endregion */

  /* #region  STATE VALIDATION FUNCTIONS */
  isValid() {
    return (
      !this.state.alreadyExists &&
      !this.state.duplicates.environmentVariables.hasRefs &&
      !this.state.duplicates.persistedFolders.hasRefs &&
      !this.state.duplicates.configurationPaths.hasRefs &&
      !this.state.duplicates.existingVolumes.hasRefs &&
      !this.state.duplicates.publishedPorts.containerPorts.hasRefs &&
      !this.state.duplicates.publishedPorts.nodePorts.hasRefs &&
      !this.state.duplicates.publishedPorts.ingressRoutes.hasRefs &&
      !this.state.duplicates.publishedPorts.loadBalancerPorts.hasRefs &&
      !this.state.exceeded.persistedFolders.hasRefs
    );
  }

  storageClassAvailable() {
    return (
      this.storageClasses &&
      this.storageClasses.length > 0 &&
      this.state.storages.quotasComputed &&
      (!this.state.storages.allRestricted || (this.state.storages.allRestricted && this.formValues.PersistedFolders.length !== 0))
    );
  }

  hasMultipleStorageClassesAvailable() {
    return this.storageClasses && this.storageClasses.length > 1;
  }

  resetDeploymentType() {
    this.formValues.DeploymentType = this.ApplicationDeploymentTypes.REPLICATED;
    this.onChangeVolumeRequestedSize();
  }

  // The data access policy panel is not shown when:
  // * There is not persisted folder specified
  showDataAccessPolicySection() {
    return this.formValues.PersistedFolders.length !== 0;
  }

  // A global deployment is not available when either:
  // * For each persisted folder specified, if one of the storage object only supports the RWO access mode
  // * The data access policy is set to ISOLATED
  supportGlobalDeployment() {
    const hasFolders = this.formValues.PersistedFolders.length !== 0;
    const hasRWOOnly = _.find(this.formValues.PersistedFolders, (item) => !item.StorageClass || _.isEqual(item.StorageClass.AccessModes, ['RWO']));
    const isIsolated = this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED;

    if ((hasFolders && hasRWOOnly) || isIsolated) {
      return false;
    }
    return true;
  }

  // A StatefulSet is defined by DataAccessPolicy === ISOLATED
  isEditAndStatefulSet() {
    return this.state.isEdit && this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED;
  }

  // A scalable deployment is available when either:
  // * No persisted folders are specified
  // * The access policy is set to shared and for each persisted folders specified, all the associated
  //   storage objects support at least RWX access mode (no RWO only)
  // * The access policy is set to isolated
  supportScalableReplicaDeployment() {
    const hasFolders = this.formValues.PersistedFolders.length !== 0;
    const hasRWOOnly = _.find(this.formValues.PersistedFolders, (item) => !item.StorageClass || _.isEqual(item.StorageClass.AccessModes, ['RWO']));
    const isIsolated = this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED;

    if (!hasFolders || isIsolated || (hasFolders && !hasRWOOnly)) {
      return true;
    }
    return false;
  }

  // For each persisted folders, returns the non scalable deployments options (storage class that only supports RWO)
  getNonScalableStorage() {
    let storageOptions = [];

    for (let i = 0; i < this.formValues.PersistedFolders.length; i++) {
      const folder = this.formValues.PersistedFolders[i];

      if (folder.StorageClass) {
        if (_.isEqual(folder.StorageClass.AccessModes, ['RWO'])) {
          storageOptions.push(folder.StorageClass.Name);
        }
      } else {
        storageOptions.push('<no storage option available>');
      }
    }

    return _.uniq(storageOptions).join(', ');
  }

  enforceReplicaCountMinimum() {
    if (this.formValues.ReplicaCount === null) {
      this.formValues.ReplicaCount = 1;
    }
  }

  resourceQuotaCapacityExceeded() {
    return !this.state.sliders.memory.max || !this.state.sliders.cpu.max;
  }

  resourceReservationsOverflow() {
    const instances = this.formValues.ReplicaCount;
    const cpu = this.formValues.CpuLimit;
    const maxCpu = this.state.sliders.cpu.max;
    const memory = this.formValues.MemoryLimit;
    const maxMemory = this.state.sliders.memory.max;

    if (cpu * instances > maxCpu) {
      return true;
    }

    if (memory * instances > maxMemory) {
      return true;
    }

    return false;
  }

  autoScalerOverflow() {
    const instances = this.formValues.AutoScaler.MaxReplicas;
    const cpu = this.formValues.CpuLimit;
    const maxCpu = this.state.sliders.cpu.max;
    const memory = this.formValues.MemoryLimit;
    const maxMemory = this.state.sliders.memory.max;

    if (cpu * instances > maxCpu) {
      return true;
    }

    if (memory * instances > maxMemory) {
      return true;
    }

    return false;
  }

  publishViaLoadBalancerEnabled() {
    return this.state.useLoadBalancer && this.state.maxLoadBalancersQuota !== 0;
  }

  publishViaIngressEnabled() {
    return this.filteredIngresses.length;
  }

  isEditAndNoChangesMade() {
    if (!this.state.isEdit) return false;
    const changes = JsonPatch.compare(this.savedFormValues, this.formValues);
    this.editChanges = _.filter(changes, (change) => !_.includes(change.path, '$$hashKey') && change.path !== '/ApplicationType');
    return !this.editChanges.length;
  }

  /* #region  PERSISTED FOLDERS */
  /* #region  BUTTONS STATES */
  isAddPersistentFolderButtonShowed() {
    return !this.isEditAndStatefulSet() && this.formValues.Containers.length <= 1;
  }

  isNewVolumeButtonDisabled(index) {
    return this.isEditAndExistingPersistedFolder(index) || this.allQuotasExhaustedAndVolumesAvailable();
  }

  isExistingVolumeButtonDisabled() {
    return !this.hasAvailableVolumes() || (this.isEdit && this.application.ApplicationType === this.ApplicationTypes.STATEFULSET);
  }
  /* #endregion */

  allQuotasExhausted() {
    if (!this.storageClassAvailable() || !this.state.storages.quotasComputed) {
      return true;
    }
    const total = _.reduce(
      _.map(this.storageClasses, 'Name'),
      (sum, key) => {
        const availableSize = this.state.storages.availabilities[key];
        return availableSize ? sum + availableSize : sum;
      },
      0
    );
    return this.storageClasses.length === _.keys(this.state.storages.availabilities).length && total <= 0;
  }

  allQuotasExhaustedAndNoVolumesAvailable() {
    return this.allQuotasExhausted() && !this.hasAvailableVolumes();
  }

  allQuotasExhaustedAndVolumesAvailable() {
    return this.allQuotasExhausted() && this.hasAvailableVolumes();
  }

  hasAvailableVolumes() {
    return this.availableVolumes.length > 0;
  }

  isEditAndExistingPersistedFolder(index) {
    return this.state.isEdit && this.formValues.PersistedFolders[index].PersistentVolumeClaimName;
  }
  /* #endregion */

  isEditAndNotNewPublishedPort(index) {
    return this.state.isEdit && !this.formValues.PublishedPorts[index].IsNew;
  }

  isNotInternalAndHasNoPublishedPorts() {
    const toDelPorts = _.filter(this.formValues.PublishedPorts, { NeedsDeletion: true });
    const toKeepPorts = _.without(this.formValues.PublishedPorts, ...toDelPorts);
    return this.formValues.PublishingType !== KubernetesApplicationPublishingTypes.INTERNAL && toKeepPorts.length === 0;
  }

  isEditAndNotNewPlacement(index) {
    return this.state.isEdit && !this.formValues.Placements[index].IsNew;
  }

  isNewAndNotFirst(index) {
    return !this.state.isEdit && index !== 0;
  }

  showPlacementPolicySection() {
    const placements = _.filter(this.formValues.Placements, { NeedsDeletion: false });
    return placements.length !== 0;
  }

  isNonScalable() {
    const scalable = this.supportScalableReplicaDeployment();
    const global = this.supportGlobalDeployment();
    const replica = this.formValues.ReplicaCount > 1;
    const replicated = this.formValues.DeploymentType === this.ApplicationDeploymentTypes.REPLICATED;
    const res = (replicated && !scalable && replica) || (!replicated && !global);
    return res;
  }

  isMaxLoadBalancerOverflow() {
    if (!this.state.useLoadBalancer || this.formValues.PublishingType !== this.ApplicationPublishingTypes.LOAD_BALANCER) {
      return false;
    }
    if (this.state.maxLoadBalancers <= 0 && this.state.maxLoadBalancers !== null) {
      return true;
    }
    return false;
  }

  isDeployUpdateButtonDisabled() {
    const overflow = this.resourceReservationsOverflow();
    const autoScalerOverflow = this.autoScalerOverflow();
    const inProgress = this.state.actionInProgress;
    const invalid = !this.isValid();
    const hasNoChanges = this.isEditAndNoChangesMade();
    const nonScalable = this.isNonScalable();
    const notInternalNoPorts = this.isNotInternalAndHasNoPublishedPorts();
    const noResourcePool = !this.formValues.ResourcePool;
    const maxLoadBalancersOverflow = this.isMaxLoadBalancerOverflow();
    return overflow || autoScalerOverflow || inProgress || invalid || hasNoChanges || nonScalable || notInternalNoPorts || noResourcePool || maxLoadBalancersOverflow;
  }

  disableLoadBalancerEdit() {
    return (
      this.state.isEdit &&
      this.application.ServiceType === this.ServiceTypes.LOAD_BALANCER &&
      !this.application.LoadBalancerIPAddress &&
      this.formValues.PublishingType === this.ApplicationPublishingTypes.LOAD_BALANCER
    );
  }

  isPublishingTypeEditDisabled() {
    const ports = _.filter(this.formValues.PublishedPorts, { IsNew: false, NeedsDeletion: false });
    return this.state.isEdit && this.formValues.PublishedPorts.length > 0 && ports.length > 0;
  }

  isEditLBWithPorts() {
    return this.formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER && _.filter(this.formValues.PublishedPorts, { IsNew: false }).length;
  }

  isProtocolOptionDisabled(index, protocol) {
    return (
      this.disableLoadBalancerEdit() ||
      (this.isEditAndNotNewPublishedPort(index) && this.formValues.PublishedPorts[index].Protocol !== protocol) ||
      (this.isEditLBWithPorts() && this.formValues.PublishedPorts[index].Protocol !== protocol) ||
      (this.isNewAndNotFirst(index) && this.formValues.PublishedPorts[index].Protocol !== protocol)
    );
  }

  /* #endregion */

  /* #region  DATA AUTO REFRESH */
  updateSliders() {
    this.state.resourcePoolHasQuota = false;

    const quota = this.formValues.ResourcePool.Quota;
    let minCpu,
      maxCpu,
      minMemory,
      maxMemory = 0;
    if (quota) {
      if (quota.CpuLimit) {
        this.state.resourcePoolHasQuota = true;
        minCpu = KubernetesApplicationQuotaDefaults.CpuLimit;
        maxCpu = quota.CpuLimit - quota.CpuLimitUsed;
        if (this.state.isEdit && this.savedFormValues.CpuLimit) {
          maxCpu += this.savedFormValues.CpuLimit * this.savedFormValues.ReplicaCount;
        }
      } else {
        minCpu = 0;
        maxCpu = this.state.nodes.cpu;
      }
      if (quota.MemoryLimit) {
        this.state.resourcePoolHasQuota = true;
        minMemory = KubernetesApplicationQuotaDefaults.MemoryLimit;
        maxMemory = quota.MemoryLimit - quota.MemoryLimitUsed;
        if (this.state.isEdit && this.savedFormValues.MemoryLimit) {
          maxMemory += KubernetesResourceReservationHelper.bytesValue(this.savedFormValues.MemoryLimit) * this.savedFormValues.ReplicaCount;
        }
      } else {
        minMemory = 0;
        maxMemory = this.state.nodes.memory;
      }
    } else {
      minCpu = 0;
      maxCpu = this.state.nodes.cpu;
      minMemory = 0;
      maxMemory = this.state.nodes.memory;
    }
    this.state.sliders.memory.min = minMemory;
    this.state.sliders.memory.max = KubernetesResourceReservationHelper.megaBytesValue(maxMemory);
    this.state.sliders.cpu.min = minCpu;
    this.state.sliders.cpu.max = _.round(maxCpu, 2);
    if (!this.state.isEdit) {
      this.formValues.CpuLimit = minCpu;
      this.formValues.MemoryLimit = minMemory;
    }
  }

  refreshStacks(namespace) {
    return this.$async(async () => {
      try {
        this.stacks = await this.KubernetesStackService.get(namespace);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve stacks');
      }
    });
  }

  refreshConfigurations(namespace) {
    return this.$async(async () => {
      try {
        this.configurations = await this.KubernetesConfigurationService.get(namespace);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
      }
    });
  }

  refreshApplications(namespace) {
    return this.$async(async () => {
      try {
        this.applications = await this.KubernetesApplicationService.get(namespace);
        this.state.maxLoadBalancers = null;
        this.state.maxLoadBalancersQuota = null;
        if (this.formValues.ResourcePool.Quota) {
          this.state.maxLoadBalancersQuota = this.formValues.ResourcePool.Quota.LoadBalancers;
          if (this.state.maxLoadBalancersQuota !== null) {
            let appsUsingLoadBalancers = _.filter(this.applications, { ServiceType: 'LoadBalancer' });
            if (this.state.isEdit) {
              appsUsingLoadBalancers = _.filter(appsUsingLoadBalancers, (app) => {
                return app.Name !== this.formValues.Name;
              });
            }
            const appsUsingLoadBalancersLength = appsUsingLoadBalancers.length;
            this.state.maxLoadBalancers = this.state.maxLoadBalancersQuota - appsUsingLoadBalancersLength;
          }
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve applications');
      }
    });
  }

  refreshVolumes(namespace) {
    return this.$async(async () => {
      try {
        const volumes = await this.KubernetesVolumeService.get(namespace);
        _.forEach(volumes, (volume) => {
          volume.Applications = KubernetesVolumeHelper.getUsingApplications(volume, this.applications);
        });
        this.volumes = volumes;
        const filteredVolumes = _.filter(this.volumes, (volume) => {
          const isUnused = !KubernetesVolumeHelper.isUsed(volume);
          const isRWX = volume.PersistentVolumeClaim.StorageClass && _.includes(volume.PersistentVolumeClaim.StorageClass.AccessModes, 'RWX');
          return isUnused || isRWX;
        });
        this.availableVolumes = filteredVolumes;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve volumes');
      }
    });
  }

  refreshStorageAvailabilities() {
    const quota = this.formValues.ResourcePool.Quota;
    this.state.storages.availabilities = {};
    this.state.storages.quotasComputed = false;
    this.state.storages.allRestricted = false;
    if (quota && quota.StorageRequests.length) {
      const availabilities = {};
      _.forEach(quota.StorageRequests, (sr) => {
        if (sr.Selected) {
          availabilities[sr.Name] = filesizeParser(`${sr.Size}${sr.SizeUnit}`, { base: 10 });
        }
      });

      const groups = _.groupBy(this.volumes, 'PersistentVolumeClaim.StorageClass.Name');
      _.forOwn(groups, (volumes, key) => {
        if (availabilities[key]) {
          const used = _.reduce(volumes, (sum, v) => sum + filesizeParser(v.PersistentVolumeClaim.Storage, { base: 10 }), 0);
          const available = availabilities[key] - used;
          availabilities[key] = available < 0 ? 0 : available;
        }
      });
      this.state.storages.availabilities = availabilities;

      const restricted = _.filter(quota.StorageRequests, { Selected: true, Size: 0 });
      this.state.storages.allRestricted = restricted.length === quota.StorageRequests.length;
    }
    this.state.storages.quotasComputed = true;
  }

  refreshIngresses(namespace) {
    this.filteredIngresses = _.filter(this.ingresses, { Namespace: namespace });
    if (!this.publishViaIngressEnabled()) {
      if (this.savedFormValues) {
        this.formValues.PublishingType = this.savedFormValues.PublishingType;
      } else {
        this.formValues.PublishingType = this.ApplicationPublishingTypes.INTERNAL;
      }
    }
    this.formValues.OriginalIngresses = this.filteredIngresses;
  }

  refreshNamespaceData(namespace) {
    return this.$async(async () => {
      await Promise.all([
        this.refreshStacks(namespace),
        this.refreshConfigurations(namespace),
        this.refreshApplications(namespace),
        this.refreshIngresses(namespace),
        this.refreshVolumes(namespace),
      ]);
      this.onChangeName();
    });
  }

  resetFormValues() {
    this.clearConfigurations();
    this.resetPersistedFolders();
    this.resetPublishedPorts();
  }

  onResourcePoolSelectionChange() {
    return this.$async(async () => {
      const namespace = this.formValues.ResourcePool.Namespace.Name;
      this.updateSliders();
      await this.refreshNamespaceData(namespace);
      this.refreshStorageAvailabilities();
      this.resetFormValues();
    });
  }
  /* #endregion */

  /* #region  ACTIONS */
  async deployApplicationAsync() {
    this.state.actionInProgress = true;
    try {
      this.formValues.ApplicationOwner = this.Authentication.getUserDetails().username;
      _.remove(this.formValues.Configurations, (item) => item.SelectedConfiguration === undefined);
      await this.KubernetesApplicationService.create(this.formValues);
      this.Notifications.success('Application successfully deployed', this.formValues.Name);
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create application');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  async updateApplicationAsync() {
    try {
      this.state.actionInProgress = true;
      await this.KubernetesApplicationService.patch(this.savedFormValues, this.formValues);
      this.Notifications.success('Application successfully updated');
      this.$state.go('kubernetes.applications.application', { name: this.application.Name, namespace: this.application.ResourcePool });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update application');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  deployApplication() {
    if (this.state.isEdit) {
      this.ModalService.confirmUpdate('Updating the application may cause a service interruption. Do you wish to continue?', (confirmed) => {
        if (confirmed) {
          return this.$async(this.updateApplicationAsync);
        }
      });
    } else {
      return this.$async(this.deployApplicationAsync);
    }
  }
  /* #endregion */

  /* #region  APPLICATION - used on edit context only */
  getApplication() {
    return this.$async(async () => {
      try {
        const namespace = this.state.params.namespace;
        [this.application, this.persistentVolumeClaims] = await Promise.all([
          this.KubernetesApplicationService.get(namespace, this.state.params.name),
          this.KubernetesPersistentVolumeClaimService.get(namespace),
        ]);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve application details');
      }
    });
  }
  /* #endregion */

  /* #region  ON INIT */
  $onInit() {
    return this.$async(async () => {
      try {
        this.Authentication.redirectIfUnauthorized(['K8sApplicationDetailsW']);

        this.state = {
          actionInProgress: false,
          useLoadBalancer: false,
          useServerMetrics: false,
          storages: {
            quotasComputed: false,
            allRestricted: false,
            availabilities: {},
            quotaExceeded: false,
          },
          sliders: {
            cpu: {
              min: 0,
              max: 0,
            },
            memory: {
              min: 0,
              max: 0,
            },
          },
          nodes: {
            memory: 0,
            cpu: 0,
          },
          maxLoadBalancers: null,
          maxLoadBalancersQuota: null,
          resourcePoolHasQuota: false,
          viewReady: false,
          availableSizeUnits: ['MB', 'GB', 'TB'],
          alreadyExists: false,
          duplicates: {
            environmentVariables: new KubernetesFormValidationReferences(),
            persistedFolders: new KubernetesFormValidationReferences(),
            configurationPaths: new KubernetesFormValidationReferences(),
            existingVolumes: new KubernetesFormValidationReferences(),
            publishedPorts: {
              containerPorts: new KubernetesFormValidationReferences(),
              nodePorts: new KubernetesFormValidationReferences(),
              ingressRoutes: new KubernetesFormValidationReferences(),
              loadBalancerPorts: new KubernetesFormValidationReferences(),
            },
            placements: new KubernetesFormValidationReferences(),
          },
          exceeded: {
            persistedFolders: new KubernetesFormValidationReferences(),
          },
          isEdit: false,
          params: {
            namespace: this.$transition$.params().namespace,
            name: this.$transition$.params().name,
          },
          persistedFoldersUseExistingVolumes: false,
        };

        this.isAdmin = this.Authentication.isAdmin();

        this.editChanges = [];

        if (this.state.params.namespace && this.state.params.name) {
          this.state.isEdit = true;
        }

        const endpoint = this.EndpointProvider.currentEndpoint();
        this.endpoint = endpoint;
        this.storageClasses = endpoint.Kubernetes.Configuration.StorageClasses;
        this.state.useLoadBalancer = endpoint.Kubernetes.Configuration.UseLoadBalancer;
        this.state.useServerMetrics = endpoint.Kubernetes.Configuration.UseServerMetrics;

        this.formValues = new KubernetesApplicationFormValues();

        const [resourcePools, nodes, ingresses] = await Promise.all([
          this.KubernetesResourcePoolService.get(),
          this.KubernetesNodeService.get(),
          this.KubernetesIngressService.get(),
        ]);
        this.ingresses = ingresses;

        this.resourcePools = _.filter(resourcePools, (resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));
        this.formValues.ResourcePool = this.resourcePools[0];
        if (!this.formValues.ResourcePool) {
          return;
        }

        _.forEach(nodes, (item) => {
          this.state.nodes.memory += filesizeParser(item.Memory);
          this.state.nodes.cpu += item.CPU;
        });
        this.nodesLabels = KubernetesNodeHelper.generateNodeLabelsFromNodes(nodes);

        const namespace = this.state.isEdit ? this.state.params.namespace : this.formValues.ResourcePool.Namespace.Name;
        await this.refreshNamespaceData(namespace);

        if (this.state.isEdit) {
          await this.getApplication();
          this.formValues = KubernetesApplicationConverter.applicationToFormValues(
            this.application,
            this.resourcePools,
            this.configurations,
            this.persistentVolumeClaims,
            this.nodesLabels
          );
          this.formValues.OriginalIngresses = this.filteredIngresses;
          this.savedFormValues = angular.copy(this.formValues);
          delete this.formValues.ApplicationType;

          if (this.application.ApplicationType !== KubernetesApplicationTypes.STATEFULSET) {
            _.forEach(this.formValues.PersistedFolders, (persistedFolder) => {
              const volume = _.find(this.availableVolumes, ['PersistentVolumeClaim.Name', persistedFolder.PersistentVolumeClaimName]);
              if (volume) {
                persistedFolder.UseNewVolume = false;
                persistedFolder.ExistingVolume = volume;
              }
            });
          }
          await this.refreshNamespaceData(namespace);
        } else {
          this.formValues.AutoScaler = KubernetesApplicationHelper.generateAutoScalerFormValueFromHorizontalPodAutoScaler(null, this.formValues.ReplicaCount);
          this.formValues.OriginalIngressClasses = angular.copy(this.ingresses);
        }

        this.updateSliders();
        this.refreshStorageAvailabilities();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load view data');
      } finally {
        this.state.viewReady = true;
      }
    });
  }

  /* #endregion */
}

export default KubernetesCreateApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateApplicationController', KubernetesCreateApplicationController);
