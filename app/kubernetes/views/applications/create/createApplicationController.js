import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import * as JsonPatch from 'fast-json-patch';
import { RegistryTypes } from '@/portainer/models/registryTypes';

import {
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationQuotaDefaults,
  KubernetesApplicationTypes,
  KubernetesApplicationPlacementTypes,
  KubernetesDeploymentTypes,
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
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { KubernetesNodeHelper } from 'Kubernetes/node/helper';

class KubernetesCreateApplicationController {
  /* #region  CONSTRUCTOR */

  /* @ngInject */
  constructor(
    $scope,
    $async,
    $state,
    Notifications,
    Authentication,
    ModalService,
    KubernetesResourcePoolService,
    KubernetesApplicationService,
    KubernetesStackService,
    KubernetesConfigurationService,
    KubernetesNodeService,
    KubernetesIngressService,
    KubernetesPersistentVolumeClaimService,
    KubernetesVolumeService,
    RegistryService,
    StackService,
    KubernetesNodesLimitsService
  ) {
    this.$scope = $scope;
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
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
    this.RegistryService = RegistryService;
    this.StackService = StackService;
    this.KubernetesNodesLimitsService = KubernetesNodesLimitsService;

    this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.ApplicationPublishingTypes = KubernetesApplicationPublishingTypes;
    this.ApplicationPlacementTypes = KubernetesApplicationPlacementTypes;
    this.ApplicationTypes = KubernetesApplicationTypes;
    this.ApplicationConfigurationFormValueOverridenKeyTypes = KubernetesApplicationConfigurationFormValueOverridenKeyTypes;
    this.ServiceTypes = KubernetesServiceTypes;
    this.KubernetesDeploymentTypes = KubernetesDeploymentTypes;

    this.state = {
      appType: this.KubernetesDeploymentTypes.APPLICATION_FORM,
      updateWebEditorInProgress: false,
      actionInProgress: false,
      useLoadBalancer: false,
      useServerMetrics: false,
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
      namespaceLimits: {
        memory: 0,
        cpu: 0,
      },
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
      isEdit: this.$state.params.namespace && this.$state.params.name,
      persistedFoldersUseExistingVolumes: false,
      pullImageValidity: false,
    };

    this.isAdmin = this.Authentication.isAdmin();

    this.editChanges = [];

    this.storageClasses = [];
    this.state.useLoadBalancer = false;
    this.state.useServerMetrics = false;

    this.formValues = new KubernetesApplicationFormValues();

    this.updateApplicationAsync = this.updateApplicationAsync.bind(this);
    this.deployApplicationAsync = this.deployApplicationAsync.bind(this);
    this.setPullImageValidity = this.setPullImageValidity.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onServicePublishChange = this.onServicePublishChange.bind(this);
  }
  /* #endregion */

  onChangeFileContent(value) {
    if (this.stackFileContent.replace(/(\r\n|\n|\r)/gm, '') !== value.replace(/(\r\n|\n|\r)/gm, '')) {
      this.state.isEditorDirty = true;
      this.stackFileContent = value;
    }
  }

  async updateApplicationViaWebEditor() {
    return this.$async(async () => {
      try {
        const confirmed = await this.ModalService.confirmAsync({
          title: 'Are you sure?',
          message: 'Any changes to this application will be overriden and may cause a service interruption. Do you wish to continue?',
          buttons: {
            confirm: {
              label: 'Update',
              className: 'btn-warning',
            },
          },
        });
        if (!confirmed) {
          return;
        }
        this.state.updateWebEditorInProgress = true;
        await this.StackService.updateKubeStack({ EndpointId: this.endpoint.Id, Id: this.application.StackId }, this.stackFileContent, null);
        this.state.isEditorDirty = false;
        await this.$state.reload(this.$state.current);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed redeploying application');
      } finally {
        this.state.updateWebEditorInProgress = false;
      }
    });
  }

  async uiCanExit() {
    if (this.stackFileContent && this.state.isEditorDirty) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }

  setPullImageValidity(validity) {
    this.state.pullImageValidity = validity;
  }

  imageValidityIsValid() {
    return this.state.pullImageValidity || this.formValues.ImageModel.Registry.Type !== RegistryTypes.DOCKERHUB;
  }

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

  restoreEnvironmentVariable(item) {
    item.NeedsDeletion = false;
  }

  removeEnvironmentVariable(item) {
    const index = this.formValues.EnvironmentVariables.indexOf(item);
    if (index !== -1) {
      const envVar = this.formValues.EnvironmentVariables[index];
      if (!envVar.IsNew) {
        envVar.NeedsDeletion = true;
      } else {
        this.formValues.EnvironmentVariables.splice(index, 1);
      }
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
    this.formValues.PersistedFolders.push(newPf);
    this.resetDeploymentType();
  }

  restorePersistedFolder(index) {
    this.formValues.PersistedFolders[index].NeedsDeletion = false;
    this.validatePersistedFolders();
  }

  resetPersistedFolders() {
    this.formValues.PersistedFolders = _.forEach(this.formValues.PersistedFolders, (persistedFolder) => {
      persistedFolder.ExistingVolume = null;
      persistedFolder.UseNewVolume = true;
    });
    this.validatePersistedFolders();
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
  onServicePublishChange() {
    // enable publishing with no previous ports exposed
    if (this.formValues.IsPublishingService && !this.formValues.PublishedPorts.length) {
      this.addPublishedPort();
      return;
    }

    // service update
    if (this.formValues.IsPublishingService) {
      this.formValues.PublishedPorts.forEach((port) => (port.NeedsDeletion = false));
    } else {
      // delete new ports, mark old ports to be deleted
      this.formValues.PublishedPorts = this.formValues.PublishedPorts.filter((port) => !port.IsNew).map((port) => ({ ...port, NeedsDeletion: true }));
    }
  }

  addPublishedPort() {
    const p = new KubernetesApplicationPublishedPortFormValue();
    const ingresses = this.ingresses;
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      p.IngressName = ingresses && ingresses.length ? ingresses[0].Name : undefined;
      p.IngressHost = ingresses && ingresses.length ? ingresses[0].Hosts[0] : undefined;
      p.IngressHosts = ingresses && ingresses.length ? ingresses[0].Hosts : undefined;
    }
    if (this.formValues.PublishedPorts.length) {
      p.Protocol = this.formValues.PublishedPorts[0].Protocol;
    }
    this.formValues.PublishedPorts.push(p);
  }

  resetPublishedPorts() {
    const ingresses = this.ingresses;
    _.forEach(this.formValues.PublishedPorts, (p) => {
      p.IngressName = ingresses && ingresses.length ? ingresses[0].Name : undefined;
      p.IngressHost = ingresses && ingresses.length ? ingresses[0].Hosts[0] : undefined;
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
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.NODE_PORT) {
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
    const ingress = _.find(this.ingresses, { Name: publishedPort.IngressName });
    publishedPort.IngressHosts = ingress.Hosts;
    this.ingressHostnames = ingress.Hosts;
    publishedPort.IngressHost = this.ingressHostnames.length ? this.ingressHostnames[0] : [];
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
    if (this.formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
      const newPorts = _.filter(this.formValues.PublishedPorts, { IsNew: true });
      _.forEach(newPorts, (port) => {
        port.Protocol = index ? this.formValues.PublishedPorts[index].Protocol : newPorts[0].Protocol;
      });
      this.onChangePortMappingLoadBalancer();
    }
    this.onChangePortMappingContainerPort();
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
      !this.state.duplicates.publishedPorts.loadBalancerPorts.hasRefs
    );
  }

  storageClassAvailable() {
    return this.storageClasses && this.storageClasses.length > 0;
  }

  hasMultipleStorageClassesAvailable() {
    return this.storageClasses && this.storageClasses.length > 1;
  }

  resetDeploymentType() {
    this.formValues.DeploymentType = this.ApplicationDeploymentTypes.REPLICATED;
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
    const hasRWOOnly = KubernetesApplicationHelper.hasRWOOnly(this.formValues);
    const isIsolated = this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.ISOLATED;

    if (hasFolders && (hasRWOOnly || isIsolated)) {
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
    const hasRWOOnly = KubernetesApplicationHelper.hasRWOOnly(this.formValues);
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

      if (folder.StorageClass && _.isEqual(folder.StorageClass.AccessModes, ['RWO'])) {
        storageOptions.push(folder.StorageClass.Name);
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

  nodeLimitsOverflow() {
    const cpu = this.formValues.CpuLimit;
    const memory = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);

    const overflow = this.nodesLimits.overflowForReplica(cpu, memory, 1);

    return overflow;
  }

  effectiveInstances() {
    return this.formValues.DeploymentType === this.ApplicationDeploymentTypes.GLOBAL ? this.nodeNumber : this.formValues.ReplicaCount;
  }

  resourceReservationsOverflow() {
    const instances = this.effectiveInstances();
    const cpu = this.formValues.CpuLimit;
    const maxCpu = this.state.namespaceLimits.cpu;
    const memory = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);
    const maxMemory = this.state.namespaceLimits.memory;

    // multiply 1000 can avoid 0.1 * 3 > 0.3
    if (cpu * 1000 * instances > maxCpu * 1000) {
      return true;
    }

    if (memory * instances > maxMemory) {
      return true;
    }

    if (this.formValues.DeploymentType === this.ApplicationDeploymentTypes.REPLICATED) {
      return this.nodesLimits.overflowForReplica(cpu, memory, instances);
    }

    // DeploymentType == GLOBAL
    return this.nodesLimits.overflowForGlobal(cpu, memory);
  }

  autoScalerOverflow() {
    const instances = this.formValues.AutoScaler.MaxReplicas;
    const cpu = this.formValues.CpuLimit;
    const maxCpu = this.state.namespaceLimits.cpu;
    const memory = KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit);
    const maxMemory = this.state.namespaceLimits.memory;

    // multiply 1000 can avoid 0.1 * 3 > 0.3
    if (cpu * 1000 * instances > maxCpu * 1000) {
      return true;
    }

    if (memory * instances > maxMemory) {
      return true;
    }

    return this.nodesLimits.overflowForReplica(cpu, memory, instances);
  }

  publishViaLoadBalancerEnabled() {
    return this.state.useLoadBalancer && this.state.maxLoadBalancersQuota !== 0;
  }

  publishViaIngressEnabled() {
    return this.ingresses.length;
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
    return this.isEditAndExistingPersistedFolder(index);
  }

  isExistingVolumeButtonDisabled() {
    return !this.hasAvailableVolumes() || (this.isEdit && this.application.ApplicationType === this.ApplicationTypes.STATEFULSET);
  }
  /* #endregion */

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

  hasNoPublishedPorts() {
    return this.formValues.PublishedPorts.filter((port) => !port.NeedsDeletion).length === 0;
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

  isDeployUpdateButtonDisabled() {
    const overflow = this.resourceReservationsOverflow();
    const autoScalerOverflow = this.autoScalerOverflow();
    const inProgress = this.state.actionInProgress;
    const invalid = !this.isValid();
    const hasNoChanges = this.isEditAndNoChangesMade();
    const nonScalable = this.isNonScalable();
    const isPublishingWithoutPorts = this.formValues.IsPublishingService && this.hasNoPublishedPorts();
    return overflow || autoScalerOverflow || inProgress || invalid || hasNoChanges || nonScalable || isPublishingWithoutPorts;
  }

  isExternalApplication() {
    if (this.application) {
      return KubernetesApplicationHelper.isExternalApplication(this.application);
    } else {
      return false;
    }
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
    return this.formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER && _.filter(this.formValues.PublishedPorts, { IsNew: false }).length === 0;
  }

  isProtocolOptionDisabled(index, protocol) {
    return (
      this.disableLoadBalancerEdit() ||
      (this.isEditAndNotNewPublishedPort(index) && this.formValues.PublishedPorts[index].Protocol !== protocol) ||
      (this.isEditLBWithPorts() && this.formValues.PublishedPorts[index].Protocol !== protocol && this.isNewAndNotFirst(index))
    );
  }

  /* #endregion */

  /* #region  DATA AUTO REFRESH */
  updateSliders() {
    const quota = this.formValues.ResourcePool.Quota;
    let minCpu = 0,
      minMemory = 0,
      maxCpu = this.state.namespaceLimits.cpu,
      maxMemory = this.state.namespaceLimits.memory;

    if (quota) {
      if (quota.CpuLimit) {
        minCpu = KubernetesApplicationQuotaDefaults.CpuLimit;
      }
      if (quota.MemoryLimit) {
        minMemory = KubernetesResourceReservationHelper.bytesValue(KubernetesApplicationQuotaDefaults.MemoryLimit);
      }
    }

    maxCpu = Math.min(maxCpu, this.nodesLimits.MaxCPU);
    maxMemory = Math.min(maxMemory, this.nodesLimits.MaxMemory);

    if (maxMemory < minMemory) {
      minMemory = 0;
      maxMemory = 0;
    }

    this.state.sliders.memory.min = KubernetesResourceReservationHelper.megaBytesValue(minMemory);
    this.state.sliders.memory.max = KubernetesResourceReservationHelper.megaBytesValue(maxMemory);
    this.state.sliders.cpu.min = minCpu;
    this.state.sliders.cpu.max = _.floor(maxCpu, 2);
    if (!this.state.isEdit) {
      this.formValues.CpuLimit = minCpu;
      this.formValues.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(minMemory);
    }
  }

  updateNamespaceLimits() {
    let maxCpu = this.state.nodes.cpu;
    let maxMemory = this.state.nodes.memory;
    const quota = this.formValues.ResourcePool.Quota;

    this.state.resourcePoolHasQuota = false;

    if (quota) {
      if (quota.CpuLimit) {
        this.state.resourcePoolHasQuota = true;
        maxCpu = quota.CpuLimit - quota.CpuLimitUsed;
        if (this.state.isEdit && this.savedFormValues.CpuLimit) {
          maxCpu += this.savedFormValues.CpuLimit * this.effectiveInstances();
        }
      }

      if (quota.MemoryLimit) {
        this.state.resourcePoolHasQuota = true;
        maxMemory = quota.MemoryLimit - quota.MemoryLimitUsed;
        if (this.state.isEdit && this.savedFormValues.MemoryLimit) {
          maxMemory += KubernetesResourceReservationHelper.bytesValue(this.savedFormValues.MemoryLimit) * this.effectiveInstances();
        }
      }
    }

    this.state.namespaceLimits.cpu = maxCpu;
    this.state.namespaceLimits.memory = maxMemory;
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
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve applications');
      }
    });
  }

  refreshVolumes(namespace) {
    return this.$async(async () => {
      try {
        const storageClasses = this.endpoint.Kubernetes.Configuration.StorageClasses;
        const volumes = await this.KubernetesVolumeService.get(namespace, storageClasses);
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

  refreshIngresses(namespace) {
    return this.$async(async () => {
      try {
        this.ingresses = await this.KubernetesIngressService.get(namespace);
        this.ingressHostnames = this.ingresses.length ? this.ingresses[0].Hosts : [];
        if (!this.publishViaIngressEnabled()) {
          if (this.savedFormValues) {
            this.formValues.PublishingType = this.savedFormValues.PublishingType;
          } else {
            this.formValues.PublishingType = this.ApplicationPublishingTypes.CLUSTER_IP;
          }
        }
        this.formValues.OriginalIngresses = this.ingresses;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve ingresses');
      }
    });
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
      this.updateNamespaceLimits();
      this.updateSliders();
      await this.refreshNamespaceData(namespace);
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
        const namespace = this.$state.params.namespace;
        const storageClasses = this.endpoint.Kubernetes.Configuration.StorageClasses;

        [this.application, this.persistentVolumeClaims] = await Promise.all([
          this.KubernetesApplicationService.get(namespace, this.$state.params.name),
          this.KubernetesPersistentVolumeClaimService.get(namespace, storageClasses),
        ]);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve application details');
      }
    });
  }

  async parseImageConfiguration(imageModel) {
    return this.$async(async () => {
      try {
        return await this.RegistryService.retrievePorRegistryModelFromRepository(imageModel.Image, this.endpoint.Id, imageModel.Registry.Id, this.$state.params.namespace);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registry');
        return imageModel;
      }
    });
  }
  /* #endregion */

  /* #region  ON INIT */
  $onInit() {
    return this.$async(async () => {
      try {
        this.storageClasses = this.endpoint.Kubernetes.Configuration.StorageClasses;
        this.state.useLoadBalancer = this.endpoint.Kubernetes.Configuration.UseLoadBalancer;
        this.state.useServerMetrics = this.endpoint.Kubernetes.Configuration.UseServerMetrics;

        const [resourcePools, nodes, nodesLimits] = await Promise.all([
          this.KubernetesResourcePoolService.get(),
          this.KubernetesNodeService.get(),
          this.KubernetesNodesLimitsService.get(),
        ]);
        this.nodesLimits = nodesLimits;

        const nonSystemNamespaces = _.filter(resourcePools, (resourcePool) => !KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));

        this.resourcePools = _.sortBy(nonSystemNamespaces, ({ Namespace }) => (Namespace.Name === 'default' ? 0 : 1));

        this.formValues.ResourcePool = this.resourcePools[0];
        if (!this.formValues.ResourcePool) {
          return;
        }

        _.forEach(nodes, (item) => {
          this.state.nodes.memory += filesizeParser(item.Memory);
          this.state.nodes.cpu += item.CPU;
        });
        this.nodesLabels = KubernetesNodeHelper.generateNodeLabelsFromNodes(nodes);
        this.nodeNumber = nodes.length;

        const namespace = this.state.isEdit ? this.$state.params.namespace : this.formValues.ResourcePool.Namespace.Name;
        await this.refreshNamespaceData(namespace);

        if (this.state.isEdit) {
          await this.getApplication();
          this.formValues = KubernetesApplicationConverter.applicationToFormValues(
            this.application,
            this.resourcePools,
            this.configurations,
            this.persistentVolumeClaims,
            this.nodesLabels,
            this.ingresses
          );

          if (this.application.ApplicationKind) {
            this.state.appType = KubernetesDeploymentTypes[this.application.ApplicationKind.toUpperCase()];
            if (this.application.ApplicationKind === KubernetesDeploymentTypes.URL) {
              this.state.appType = KubernetesDeploymentTypes.CONTENT;
            }

            if (this.application.StackId) {
              this.stack = await this.StackService.stack(this.application.StackId);
              if (this.state.appType === KubernetesDeploymentTypes.CONTENT) {
                this.stackFileContent = await this.StackService.getStackFile(this.application.StackId);
              }
            }
          }

          this.formValues.OriginalIngresses = this.ingresses;
          this.formValues.ImageModel = await this.parseImageConfiguration(this.formValues.ImageModel);
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
        }

        if (this.state.isEdit) {
          this.nodesLimits.excludesPods(this.application.Pods, this.formValues.CpuLimit, KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit));
        }

        this.formValues.IsPublishingService = this.formValues.PublishedPorts.length > 0;

        this.updateNamespaceLimits();
        this.updateSliders();
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
