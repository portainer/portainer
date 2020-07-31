import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import * as JsonPatch from 'fast-json-patch';

import {
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationPublishingTypes,
  KubernetesApplicationQuotaDefaults,
} from 'Kubernetes/models/application/models';
import {
  KubernetesApplicationConfigurationFormValue,
  KubernetesApplicationConfigurationFormValueOverridenKey,
  KubernetesApplicationConfigurationFormValueOverridenKeyTypes,
  KubernetesApplicationEnvironmentVariableFormValue,
  KubernetesApplicationFormValues,
  KubernetesApplicationPersistedFolderFormValue,
  KubernetesApplicationPublishedPortFormValue,
} from 'Kubernetes/models/application/formValues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application/index';

class KubernetesCreateApplicationController {
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
    KubernetesPersistentVolumeClaimService,
    KubernetesNamespaceHelper
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
    this.KubernetesPersistentVolumeClaimService = KubernetesPersistentVolumeClaimService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.ApplicationPublishingTypes = KubernetesApplicationPublishingTypes;
    this.ApplicationConfigurationFormValueOverridenKeyTypes = KubernetesApplicationConfigurationFormValueOverridenKeyTypes;
    this.ServiceTypes = KubernetesServiceTypes;

    this.onInit = this.onInit.bind(this);
    this.updateApplicationAsync = this.updateApplicationAsync.bind(this);
    this.deployApplicationAsync = this.deployApplicationAsync.bind(this);
    this.updateSlidersAsync = this.updateSlidersAsync.bind(this);
    this.refreshStacksAsync = this.refreshStacksAsync.bind(this);
    this.refreshConfigurationsAsync = this.refreshConfigurationsAsync.bind(this);
    this.refreshApplicationsAsync = this.refreshApplicationsAsync.bind(this);
    this.refreshStacksConfigsAppsAsync = this.refreshStacksConfigsAppsAsync.bind(this);
    this.getApplicationAsync = this.getApplicationAsync.bind(this);
  }

  isValid() {
    return !this.state.alreadyExists && !this.state.hasDuplicateEnvironmentVariables && !this.state.hasDuplicatePersistedFolderPaths && !this.state.hasDuplicateConfigurationPaths;
  }

  onChangeName() {
    const existingApplication = _.find(this.applications, { Name: this.formValues.Name });
    this.state.alreadyExists = (this.state.isEdit && existingApplication && this.application.Id !== existingApplication.Id) || (!this.state.isEdit && existingApplication);
  }

  /**
   * AUTO SCALER UI MANAGEMENT
   */

  unselectAutoScaler() {
    if (this.formValues.DeploymentType === this.ApplicationDeploymentTypes.GLOBAL) {
      this.formValues.AutoScaler.IsUsed = false;
    }
  }

  /**
   * CONFIGURATION UI MANAGEMENT
   */
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

  onChangeConfigurationPath() {
    this.state.duplicateConfigurationPaths = [];

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
          this.state.duplicateConfigurationPaths[index + '_' + keyIndex] = findPath;
        }
      });
    });

    this.state.hasDuplicateConfigurationPaths = Object.keys(this.state.duplicateConfigurationPaths).length > 0;
  }
  /**
   * !CONFIGURATION UI MANAGEMENT
   */

  /**
   * ENVIRONMENT UI MANAGEMENT
   */
  addEnvironmentVariable() {
    this.formValues.EnvironmentVariables.push(new KubernetesApplicationEnvironmentVariableFormValue());
  }

  hasEnvironmentVariables() {
    return this.formValues.EnvironmentVariables.length > 0;
  }

  onChangeEnvironmentName() {
    this.state.duplicateEnvironmentVariables = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.EnvironmentVariables, 'Name'));
    this.state.hasDuplicateEnvironmentVariables = Object.keys(this.state.duplicateEnvironmentVariables).length > 0;
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
  /**
   * !ENVIRONMENT UI MANAGEMENT
   */

  /**
   * PERSISTENT FOLDERS UI MANAGEMENT
   */
  addPersistedFolder() {
    let storageClass = {};
    if (this.storageClasses.length > 0) {
      storageClass = this.storageClasses[0];
    }

    this.formValues.PersistedFolders.push(new KubernetesApplicationPersistedFolderFormValue(storageClass));
    this.resetDeploymentType();
  }

  onChangePersistedFolderPath() {
    this.state.duplicatePersistedFolderPaths = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.PersistedFolders, 'ContainerPath'));
    this.state.hasDuplicatePersistedFolderPaths = Object.keys(this.state.duplicatePersistedFolderPaths).length > 0;
  }

  restorePersistedFolder(index) {
    this.formValues.PersistedFolders[index].NeedsDeletion = false;
  }

  removePersistedFolder(index) {
    if (this.state.isEdit && this.formValues.PersistedFolders[index].PersistentVolumeClaimName) {
      this.formValues.PersistedFolders[index].NeedsDeletion = true;
    } else {
      this.formValues.PersistedFolders.splice(index, 1);
    }
    this.onChangePersistedFolderPath();
  }
  /**
   * !PERSISTENT FOLDERS UI MANAGEMENT
   */

  /**
   * PUBLISHED PORTS UI MANAGEMENT
   */
  addPublishedPort() {
    this.formValues.PublishedPorts.push(new KubernetesApplicationPublishedPortFormValue());
  }

  removePublishedPort(index) {
    this.formValues.PublishedPorts.splice(index, 1);
  }
  /**
   * !PUBLISHED PORTS UI MANAGEMENT
   */

  /**
   * STATE VALIDATION FUNCTIONS
   */
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
    const hasRWOOnly = _.find(this.formValues.PersistedFolders, (item) => _.isEqual(item.StorageClass.AccessModes, ['RWO']));
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
    const hasRWOOnly = _.find(this.formValues.PersistedFolders, (item) => _.isEqual(item.StorageClass.AccessModes, ['RWO']));
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

      if (_.isEqual(folder.StorageClass.AccessModes, ['RWO'])) {
        storageOptions.push(folder.StorageClass.Name);
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
    const cpu = this.formValues.CpuLimit;
    const maxCpu = this.state.sliders.cpu.max;
    const maxInstances = this.formValues.AutoScaler.MaxReplicas;

    return cpu * maxInstances > maxCpu;
  }

  publishViaLoadBalancerEnabled() {
    return this.state.useLoadBalancer;
  }

  isEditAndNoChangesMade() {
    if (!this.state.isEdit) return false;
    const changes = JsonPatch.compare(this.savedFormValues, this.formValues);
    this.editChanges = _.filter(changes, (change) => !_.includes(change.path, '$$hashKey') && change.path !== '/ApplicationType');
    return !this.editChanges.length;
  }

  isEditAndExistingPersistedFolder(index) {
    return this.state.isEdit && this.formValues.PersistedFolders[index].PersistentVolumeClaimName;
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
    const res = overflow || autoScalerOverflow || inProgress || invalid || hasNoChanges || nonScalable;
    return res;
  }

  disableLoadBalancerEdit() {
    return (
      this.state.isEdit &&
      this.application.ServiceType === this.ServiceTypes.LOAD_BALANCER &&
      !this.application.LoadBalancerIPAddress &&
      this.formValues.PublishingType === this.ApplicationPublishingTypes.LOAD_BALANCER
    );
  }
  /**
   * !STATE VALIDATION FUNCTIONS
   */

  /**
   * DATA AUTO REFRESH
   */
  async updateSlidersAsync() {
    try {
      const quota = this.formValues.ResourcePool.Quota;
      let minCpu,
        maxCpu,
        minMemory,
        maxMemory = 0;
      if (quota) {
        this.state.resourcePoolHasQuota = true;
        if (quota.CpuLimit) {
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
        this.state.resourcePoolHasQuota = false;
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
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update resources selector');
    }
  }

  updateSliders() {
    return this.$async(this.updateSlidersAsync);
  }

  async refreshStacksAsync(namespace) {
    try {
      this.stacks = await this.KubernetesStackService.get(namespace);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve stacks');
    }
  }

  refreshStacks(namespace) {
    return this.$async(this.refreshStacksAsync, namespace);
  }

  async refreshConfigurationsAsync(namespace) {
    try {
      this.configurations = await this.KubernetesConfigurationService.get(namespace);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
    }
  }

  refreshConfigurations(namespace) {
    return this.$async(this.refreshConfigurationsAsync, namespace);
  }

  async refreshApplicationsAsync(namespace) {
    try {
      this.applications = await this.KubernetesApplicationService.get(namespace);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  refreshApplications(namespace) {
    return this.$async(this.refreshApplicationsAsync, namespace);
  }

  async refreshStacksConfigsAppsAsync(namespace) {
    await Promise.all([this.refreshStacks(namespace), this.refreshConfigurations(namespace), this.refreshApplications(namespace)]);
    this.onChangeName();
  }

  refreshStacksConfigsApps(namespace) {
    return this.$async(this.refreshStacksConfigsAppsAsync, namespace);
  }

  onResourcePoolSelectionChange() {
    const namespace = this.formValues.ResourcePool.Namespace.Name;
    this.updateSliders();
    this.refreshStacksConfigsApps(namespace);
    this.formValues.Configurations = [];
  }
  /**
   * !DATA AUTO REFRESH
   */

  /**
   * ACTIONS
   */
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
      this.Notifications.error('Failure', err, 'Unable to retrieve application related events');
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
  /**
   * !ACTIONS
   */

  /**
   * APPLICATION - used on edit context only
   */
  async getApplicationAsync() {
    try {
      const namespace = this.state.params.namespace;
      [this.application, this.persistentVolumeClaims] = await Promise.all([
        this.KubernetesApplicationService.get(namespace, this.state.params.name),
        this.KubernetesPersistentVolumeClaimService.get(namespace),
      ]);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application details');
    }
  }

  getApplication() {
    return this.$async(this.getApplicationAsync);
  }
  /**
   * !APPLICATION
   */

  async onInit() {
    try {
      this.state = {
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
        resourcePoolHasQuota: false,
        viewReady: false,
        availableSizeUnits: ['MB', 'GB', 'TB'],
        alreadyExists: false,
        duplicateEnvironmentVariables: {},
        hasDuplicateEnvironmentVariables: false,
        duplicatePersistedFolderPaths: {},
        hasDuplicatePersistedFolderPaths: false,
        duplicateConfigurationPaths: {},
        hasDuplicateConfigurationPaths: false,
        isEdit: false,
        params: {
          namespace: this.$transition$.params().namespace,
          name: this.$transition$.params().name,
        },
      };

      this.editChanges = [];

      if (this.$transition$.params().namespace && this.$transition$.params().name) {
        this.state.isEdit = true;
      }

      const endpoint = this.EndpointProvider.currentEndpoint();
      this.endpoint = endpoint;
      this.storageClasses = endpoint.Kubernetes.Configuration.StorageClasses;
      this.state.useLoadBalancer = endpoint.Kubernetes.Configuration.UseLoadBalancer;
      this.state.useServerMetrics = endpoint.Kubernetes.Configuration.UseServerMetrics;

      this.formValues = new KubernetesApplicationFormValues();

      const [resourcePools, nodes] = await Promise.all([this.KubernetesResourcePoolService.get(), this.KubernetesNodeService.get()]);

      this.resourcePools = _.filter(resourcePools, (resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));

      this.formValues.ResourcePool = this.resourcePools[0];

      _.forEach(nodes, (item) => {
        this.state.nodes.memory += filesizeParser(item.Memory);
        this.state.nodes.cpu += item.CPU;
      });

      const namespace = this.state.isEdit ? this.state.params.namespace : this.formValues.ResourcePool.Namespace.Name;
      await this.refreshStacksConfigsApps(namespace);

      if (this.state.isEdit) {
        await this.getApplication();
        this.formValues = KubernetesApplicationConverter.applicationToFormValues(this.application, this.resourcePools, this.configurations, this.persistentVolumeClaims);
        this.savedFormValues = angular.copy(this.formValues);
        delete this.formValues.ApplicationType;
      } else {
        this.formValues.AutoScaler = KubernetesApplicationHelper.generateAutoScalerFormValueFromHorizontalPodAutoScaler();
        this.formValues.AutoScaler.MinReplicas = this.formValues.ReplicaCount;
        this.formValues.AutoScaler.MaxReplicas = this.formValues.ReplicaCount;
      }

      await this.updateSliders();
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

export default KubernetesCreateApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateApplicationController', KubernetesCreateApplicationController);
