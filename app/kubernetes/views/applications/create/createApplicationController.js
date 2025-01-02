import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import * as JsonPatch from 'fast-json-patch';
import { RegistryTypes } from '@/portainer/models/registryTypes';
import { getServices } from '@/react/kubernetes/services/useNamespaceServices';
import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';
import { getGlobalDeploymentOptions } from '@/react/portainer/settings/settings.service';

import {
  KubernetesApplicationDataAccessPolicies,
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationServiceTypes,
  KubernetesApplicationTypes,
} from 'Kubernetes/models/application/models/appConstants';
import { KubernetesApplicationQuotaDefaults, KubernetesDeploymentTypes } from 'Kubernetes/models/application/models';
import { KubernetesApplicationEnvironmentVariableFormValue, KubernetesApplicationFormValues, KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import KubernetesApplicationConverter from 'Kubernetes/converters/application';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application/index';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { KubernetesNodeHelper } from 'Kubernetes/node/helper';
import { updateIngress, getIngresses } from '@/react/kubernetes/ingresses/service';
import { confirmUpdateAppIngress } from '@/react/kubernetes/applications/CreateView/UpdateIngressPrompt';
import { KUBE_STACK_NAME_VALIDATION_REGEX } from '@/react/kubernetes/DeployView/StackName/constants';
import { isVolumeUsed } from '@/react/kubernetes/volumes/utils';
import { confirm, confirmUpdate, confirmWebEditorDiscard } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';

class KubernetesCreateApplicationController {
  /* #region  CONSTRUCTOR */

  /* @ngInject */
  constructor(
    $scope,
    $async,
    $state,
    $timeout,
    $window,
    Notifications,
    Authentication,
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
    KubernetesNodesLimitsService,
    EndpointService,
    StateManager
  ) {
    this.$scope = $scope;
    this.$async = $async;
    this.$state = $state;
    this.$timeout = $timeout;
    this.$window = $window;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
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
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;

    this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.ApplicationDataAccessPolicies = KubernetesApplicationDataAccessPolicies;
    this.KubernetesApplicationServiceTypes = KubernetesApplicationServiceTypes;
    this.ApplicationTypes = KubernetesApplicationTypes;
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
        configMapPaths: new KubernetesFormValidationReferences(),
        secretPaths: new KubernetesFormValidationReferences(),
        existingVolumes: new KubernetesFormValidationReferences(),
        placements: new KubernetesFormValidationReferences(),
      },
      isEdit: this.$state.params.namespace && this.$state.params.name,
      persistedFoldersUseExistingVolumes: false,
      pullImageValidity: false,
      nodePortServices: [],
      // when the namespace available resources changes, and the existing app not has a resource limit that exceeds whats available,
      // a validation message will be shown. isExistingCPUReservationUnchanged and isExistingMemoryReservationUnchanged (with available resources being exceeded) is used to decide whether to show the message or not.
      isExistingCPUReservationUnchanged: false,
      isExistingMemoryReservationUnchanged: false,
      stackNameError: '',
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
    this.checkIngressesToUpdate = this.checkIngressesToUpdate.bind(this);
    this.confirmUpdateApplicationAsync = this.confirmUpdateApplicationAsync.bind(this);
    this.onDataAccessPolicyChange = this.onDataAccessPolicyChange.bind(this);
    this.onChangeDeploymentType = this.onChangeDeploymentType.bind(this);
    this.supportGlobalDeployment = this.supportGlobalDeployment.bind(this);
    this.onServicesChange = this.onServicesChange.bind(this);
    this.onEnvironmentVariableChange = this.onEnvironmentVariableChange.bind(this);
    this.onConfigMapsChange = this.onConfigMapsChange.bind(this);
    this.onSecretsChange = this.onSecretsChange.bind(this);
    this.onChangePersistedFolder = this.onChangePersistedFolder.bind(this);
    this.onChangeResourceReservation = this.onChangeResourceReservation.bind(this);
    this.onChangeReplicaCount = this.onChangeReplicaCount.bind(this);
    this.onAutoScaleChange = this.onAutoScaleChange.bind(this);
    this.onChangePlacements = this.onChangePlacements.bind(this);
    this.updateApplicationType = this.updateApplicationType.bind(this);
    this.getAppType = this.getAppType.bind(this);
    this.showDataAccessPolicySection = this.showDataAccessPolicySection.bind(this);
    this.refreshReactComponent = this.refreshReactComponent.bind(this);
    this.onChangeNamespaceName = this.onChangeNamespaceName.bind(this);
    this.canSupportSharedAccess = this.canSupportSharedAccess.bind(this);
    this.isUpdateApplicationViaWebEditorButtonDisabled = this.isUpdateApplicationViaWebEditorButtonDisabled.bind(this);

    this.$scope.$watch(
      () => this.formValues,
      () => {
        this.refreshReactComponent();
      },
      _.isEqual
    );
  }
  /* #endregion */

  refreshReactComponent() {
    this.isTemporaryRefresh = true;

    this.$timeout(() => {
      this.isTemporaryRefresh = false;
    }, 10);
    this.onChangeStackName = this.onChangeStackName.bind(this);
    this.onChangeAppName = this.onChangeAppName.bind(this);
  }
  /* #endregion */

  onChangeStackName(name) {
    return this.$async(async () => {
      if (KUBE_STACK_NAME_VALIDATION_REGEX.test(name) || name === '') {
        this.state.stackNameError = '';
      } else {
        this.state.stackNameError =
          "Stack must consist of alphanumeric characters, '-', '_' or '.', must start and end with an alphanumeric character and must be 63 characters or less (e.g. 'my-name', or 'abc-123').";
      }

      this.formValues.StackName = name;
    });
  }

  onChangePlacements(values) {
    return this.$async(async () => {
      this.formValues.Placements = values.placements;
      this.formValues.PlacementType = values.placementType;
    });
  }

  onChangeDeploymentType(value) {
    this.$scope.$evalAsync(() => {
      this.formValues.DeploymentType = value;
    });
    this.updateApplicationType();
  }

  getAppType() {
    if (this.formValues.DeploymentType === this.ApplicationDeploymentTypes.Global) {
      return this.ApplicationTypes.DaemonSet;
    }
    const persistedFolders = this.formValues.PersistedFolders && this.formValues.PersistedFolders.filter((pf) => !pf.NeedsDeletion);
    if (persistedFolders && persistedFolders.length && this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.Isolated) {
      return this.ApplicationTypes.StatefulSet;
    }
    return this.ApplicationTypes.Deployment;
  }

  // keep the application type up to date
  updateApplicationType() {
    return this.$scope.$evalAsync(() => {
      this.formValues.ApplicationType = this.getAppType();
      this.validatePersistedFolders();
    });
  }

  onChangeFileContent(value) {
    this.$scope.$evalAsync(() => {
      if (this.oldStackFileContent.replace(/(\r\n|\n|\r)/gm, '') !== value.replace(/(\r\n|\n|\r)/gm, '')) {
        this.state.isEditorDirty = true;
      } else {
        this.state.isEditorDirty = false;
      }
      this.stackFileContent = value;
    });
  }

  onDataAccessPolicyChange(value) {
    this.$scope.$evalAsync(() => {
      this.formValues.DataAccessPolicy = value;
      this.resetDeploymentType();
      this.updateApplicationType();
    });
  }

  async updateApplicationViaWebEditor() {
    return this.$async(async () => {
      try {
        const confirmed = await confirm({
          title: 'Are you sure?',
          message: 'Any changes to this application will be overridden and may cause a service interruption. Do you wish to continue?',
          confirmButton: buildConfirmButton('Update', 'warning'),
          modalType: ModalType.Warn,
        });
        if (!confirmed) {
          return;
        }

        this.state.updateWebEditorInProgress = true;
        await this.StackService.updateKubeStack(
          { EndpointId: this.endpoint.Id, Id: this.application.StackId },
          { stackFile: this.stackFileContent, stackName: this.formValues.StackName }
        );
        this.state.isEditorDirty = false;
        this.Notifications.success('Success', 'Request to update application successfully submitted');
        this.$state.go(
          'kubernetes.applications.application',
          { name: this.application.Name, namespace: this.application.ResourcePool, endpointId: this.endpoint.Id },
          { inherit: false }
        );
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed redeploying application');
      } finally {
        this.state.updateWebEditorInProgress = false;
      }
    });
  }

  async uiCanExit() {
    if (this.stackFileContent && this.state.isEditorDirty) {
      return confirmWebEditorDiscard();
    }
  }

  setPullImageValidity(validity) {
    this.state.pullImageValidity = validity;
  }

  imageValidityIsValid() {
    return (
      this.isExternalApplication() || this.state.pullImageValidity || (this.formValues.registryDetails && this.formValues.registryDetails.Registry.Type !== RegistryTypes.DOCKERHUB)
    );
  }

  onChangeAppName(appName) {
    return this.$async(async () => {
      this.formValues.Name = appName;
    });
  }

  /* #region  AUTO SCALER UI MANAGEMENT */
  onAutoScaleChange(values) {
    return this.$async(async () => {
      this.formValues.AutoScaler = values;

      // reset it to previous form values if the user disables the auto scaler
      if (!this.oldFormValues.AutoScaler.isUsed && !values.isUsed) {
        this.formValues.AutoScaler = this.oldFormValues.AutoScaler;
      }
    });
  }
  /* #endregion */

  /* #region CONFIGMAP UI MANAGEMENT */
  onConfigMapsChange(configMaps) {
    return this.$async(async () => {
      this.formValues.ConfigMaps = configMaps;
    });
  }

  clearConfigMaps() {
    this.formValues.ConfigMaps = [];
  }
  /* #endregion */

  /* #region SECRET UI MANAGEMENT */
  onSecretsChange(secrets) {
    return this.$async(async () => {
      this.formValues.Secrets = secrets;
    });
  }

  clearSecrets() {
    this.formValues.Secrets = [];
  }
  /* #endregion */

  /* #region  ENVIRONMENT UI MANAGEMENT */
  onEnvironmentVariableChange(enviromnentVariables) {
    return this.$async(async () => {
      const newEnvVars = enviromnentVariables.map((envVar) => {
        const newEnvVar = new KubernetesApplicationEnvironmentVariableFormValue();
        return { newEnvVar, ...envVar };
      });
      this.formValues.EnvironmentVariables = newEnvVars;
    });
  }
  /* #endregion */

  /* #region  PERSISTENT FOLDERS UI MANAGEMENT */
  resetPersistedFolders() {
    this.formValues.PersistedFolders = _.forEach(this.formValues.PersistedFolders, (persistedFolder) => {
      persistedFolder.existingVolume = null;
      persistedFolder.useNewVolume = true;
    });
    this.validatePersistedFolders();
    this.updateApplicationType();
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
        if (persistedFolder.needsDeletion) {
          return undefined;
        }
        return persistedFolder.containerPath;
      })
    );
    this.state.duplicates.persistedFolders.hasRefs = Object.keys(this.state.duplicates.persistedFolders.refs).length > 0;
  }

  onChangePersistedFolder(values) {
    this.$scope.$evalAsync(() => {
      this.state.persistedFoldersUseExistingVolumes = values.some((pf) => pf.existingVolume);
      if (!this.state.isEdit && this.state.persistedFoldersUseExistingVolumes) {
        this.formValues.DataAccessPolicy = this.ApplicationDataAccessPolicies.Shared;
      }
      this.formValues.PersistedFolders = values;
      if (values && values.length && !this.supportGlobalDeployment()) {
        this.onChangeDeploymentType(this.ApplicationDeploymentTypes.Replicated);
      }
      this.updateApplicationType();
    });
  }

  onChangeExistingVolumeSelection() {
    this.state.duplicates.existingVolumes.refs = KubernetesFormValidationHelper.getDuplicates(
      _.map(this.formValues.PersistedFolders, (persistedFolder) => {
        if (persistedFolder.needsDeletion) {
          return undefined;
        }
        return persistedFolder.existingVolume ? persistedFolder.existingVolume.PersistentVolumeClaim.Name : '';
      })
    );
    this.state.duplicates.existingVolumes.hasRefs = Object.keys(this.state.duplicates.existingVolumes.refs).length > 0;
  }
  /* #endregion */

  /* #region SERVICES UI MANAGEMENT */
  onServicesChange(services) {
    return this.$async(async () => {
      // if the ingress isn't found in the currently loaded ingresses, then refresh the ingresses
      const ingressNamesUsed = services.flatMap((s) => s.Ports.flatMap((p) => (p.ingressPaths ? p.ingressPaths.flatMap((ip) => ip.IngressName || []) : [])));
      if (ingressNamesUsed.length) {
        const uniqueIngressNamesUsed = Array.from(new Set(ingressNamesUsed)); // get the unique ingress names used
        const ingressNamesLoaded = this.ingresses.map((i) => i.Name);
        const areAllIngressesLoaded = uniqueIngressNamesUsed.every((ingressNameUsed) => ingressNamesLoaded.includes(ingressNameUsed));
        if (!areAllIngressesLoaded) {
          this.refreshIngresses(this.application.ResourcePool);
        }
      }
      // update the services
      this.formValues.Services = services;
    });
  }
  /* #endregion */

  /* #region  STATE VALIDATION FUNCTIONS */
  isValid() {
    return (
      !this.state.duplicates.environmentVariables.hasRefs &&
      !this.state.duplicates.persistedFolders.hasRefs &&
      !this.state.duplicates.configMapPaths.hasRefs &&
      !this.state.duplicates.secretPaths.hasRefs &&
      !this.state.duplicates.existingVolumes.hasRefs
    );
  }

  storageClassAvailable() {
    return this.storageClasses && this.storageClasses.length > 0;
  }

  resetDeploymentType() {
    this.formValues.DeploymentType = this.ApplicationDeploymentTypes.Replicated;
  }

  // // The data access policy panel is shown when a persisted folder is specified
  showDataAccessPolicySection() {
    return this.formValues.PersistedFolders.length > 0;
  }

  // A global deployment is not available when either:
  // * For each persisted folder specified, if one of the storage object only supports the RWO access mode
  // * The data access policy is set to ISOLATED
  supportGlobalDeployment() {
    const hasFolders = this.formValues.PersistedFolders.length !== 0;
    const hasRWOOnly = KubernetesApplicationHelper.hasRWOOnly(this.formValues);
    const isIsolated = this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.Isolated;

    if (hasFolders && (hasRWOOnly || isIsolated)) {
      return false;
    }

    return true;
  }

  // from the pvcs in the form values, get all selected storage classes and find if they are all support RWX
  canSupportSharedAccess() {
    const formStorageClasses = this.formValues.PersistedFolders.map((pf) => pf.storageClass);
    const isRWXSupported = formStorageClasses.every((sc) => sc.AccessModes.includes('RWX'));
    return isRWXSupported;
  }

  // A StatefulSet is defined by DataAccessPolicy === 'Isolated'
  isEditAndStatefulSet() {
    return this.state.isEdit && this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.Isolated;
  }

  // A scalable deployment is available when either:
  // * No persisted folders are specified
  // * The access policy is set to shared and for each persisted folders specified, all the associated
  //   storage objects support at least RWX access mode (no RWO only)
  // * The access policy is set to isolated
  supportScalableReplicaDeployment() {
    const hasFolders = this.formValues.PersistedFolders.length !== 0;
    const hasRWOOnly = KubernetesApplicationHelper.hasRWOOnly(this.formValues);
    const isIsolated = this.formValues.DataAccessPolicy === this.ApplicationDataAccessPolicies.Isolated;

    if (!hasFolders || isIsolated || (hasFolders && !hasRWOOnly)) {
      return true;
    }
    return false;
  }

  onChangeReplicaCount(values) {
    return this.$async(async () => {
      this.formValues.ReplicaCount = values.replicaCount;
    });
  }

  // For each persisted folders, returns the non scalable deployments options (storage class that only supports RWO)
  getNonScalableStorage() {
    let storageOptions = [];

    for (let i = 0; i < this.formValues.PersistedFolders.length; i++) {
      const folder = this.formValues.PersistedFolders[i];

      if (folder.storageClass && _.isEqual(folder.storageClass.AccessModes, ['RWO'])) {
        storageOptions.push(folder.storageClass.Name);
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

  onChangeResourceReservation(values) {
    return this.$async(async () => {
      this.formValues.MemoryLimit = values.memoryLimit;
      this.formValues.CpuLimit = values.cpuLimit;

      if (this.oldFormValues.CpuLimit !== this.formValues.CpuLimit && this.state.isExistingCPUReservationUnchanged) {
        this.state.isExistingCPUReservationUnchanged = false;
      }
      if (this.oldFormValues.MemoryLimit !== this.formValues.MemoryLimit && this.state.isExistingMemoryReservationUnchanged) {
        this.state.isExistingMemoryReservationUnchanged = false;
      }
    });
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
    return this.formValues.DeploymentType === this.ApplicationDeploymentTypes.Global ? this.nodeNumber : this.formValues.ReplicaCount;
  }

  hasPortErrors() {
    const portError = this.formValues.Services.some((service) => service.nodePortError || service.servicePortError);
    return portError;
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

    if (this.formValues.DeploymentType === this.ApplicationDeploymentTypes.Replicated) {
      return this.nodesLimits.overflowForReplica(cpu, memory, instances);
    }

    // DeploymentType == 'Global'
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
  isAddPersistentFolderButtonShown() {
    return !this.isEditAndStatefulSet() && this.formValues.Containers.length <= 1;
  }

  isNewVolumeButtonDisabled(index) {
    return this.isEditAndExistingPersistedFolder(index);
  }

  isExistingVolumeButtonDisabled() {
    return !this.hasAvailableVolumes() || (this.isEdit && this.application.ApplicationType === this.ApplicationTypes.StatefulSet);
  }
  /* #endregion */

  hasAvailableVolumes() {
    return this.availableVolumes.length > 0;
  }

  isEditAndExistingPersistedFolder(index) {
    return this.state.isEdit && this.formValues.PersistedFolders[index].persistentVolumeClaimName;
  }
  /* #endregion */

  isNonScalable() {
    const scalable = this.supportScalableReplicaDeployment();
    const global = this.supportGlobalDeployment();
    const replica = this.formValues.ReplicaCount > 1;
    const replicated = this.formValues.DeploymentType === this.ApplicationDeploymentTypes.Replicated;
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
    const stackNameInvalid = this.state.stackNameError !== '';
    return overflow || autoScalerOverflow || inProgress || invalid || hasNoChanges || nonScalable || stackNameInvalid;
  }

  isUpdateApplicationViaWebEditorButtonDisabled() {
    return (this.savedFormValues.StackName === this.formValues.StackName && !this.state.isEditorDirty) || this.state.updateWebEditorInProgress;
  }

  isExternalApplication() {
    if (this.application) {
      return KubernetesApplicationHelper.isExternalApplication(this.application);
    } else {
      return false;
    }
  }
  /* #endregion */

  /* #region  DATA AUTO REFRESH */
  updateSliders(namespaceWithQuota) {
    const quota = namespaceWithQuota.Quota;
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

  updateNamespaceLimits(namespaceWithQuota) {
    return this.$async(async () => {
      let maxCpu = this.state.nodes.cpu;
      let maxMemory = this.state.nodes.memory;

      const quota = namespaceWithQuota.Quota;

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
    });
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
        this.configMaps = this.configurations.filter((configuration) => configuration.Kind === KubernetesConfigurationKinds.CONFIGMAP);
        this.secrets = this.configurations.filter((configuration) => configuration.Kind === KubernetesConfigurationKinds.SECRET);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
      }
    });
  }

  refreshApplications(namespace) {
    return this.$async(async () => {
      try {
        this.applications = await this.KubernetesApplicationService.get(namespace);
        this.applicationNames = _.map(this.applications, 'Name');
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
          const isUnused = !isVolumeUsed(volume);
          const isRWX = volume.PersistentVolumeClaim.storageClass && _.includes(volume.PersistentVolumeClaim.storageClass.AccessModes, 'RWX');
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
        this.ingressPaths = this.ingresses.flatMap((ingress) => ingress.Paths);
        this.ingressHostnames = this.ingresses.length ? this.ingresses[0].Hosts : [];
        if (!this.publishViaIngressEnabled()) {
          if (this.savedFormValues) {
            this.formValues.PublishingType = this.savedFormValues.PublishingType;
          } else {
            this.formValues.PublishingType = this.KubernetesApplicationServiceTypes.ClusterIP;
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
    });
  }

  resetFormValues() {
    this.clearConfigMaps();
    this.clearSecrets();
    this.resetPersistedFolders();
  }

  onChangeNamespaceName(namespaceName) {
    return this.$async(async () => {
      this.formValues.ResourcePool.Namespace.Name = namespaceName;
      const namespaceWithQuota = await this.KubernetesResourcePoolService.get(namespaceName);
      this.updateNamespaceLimits(namespaceWithQuota);
      this.updateSliders(namespaceWithQuota);
      await this.refreshNamespaceData(namespaceName);
      this.resetFormValues();
    });
  }
  /* #endregion */

  /* #region  ACTIONS */
  async deployApplicationAsync() {
    this.state.actionInProgress = true;
    try {
      this.formValues.ApplicationOwner = this.Authentication.getUserDetails().username;
      // combine the secrets and configmap form values when submitting the form
      _.remove(this.formValues.Configurations, (item) => item.selectedConfiguration === undefined);
      await this.KubernetesApplicationService.create(this.formValues, this.originalServicePorts, this.deploymentOptions.hideStacksFunctionality);
      this.Notifications.success('Request to deploy application successfully submitted', this.formValues.Name);
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create application');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  async updateApplicationAsync(ingressesToUpdate) {
    if (ingressesToUpdate.length) {
      try {
        await Promise.all(ingressesToUpdate.map((ing) => updateIngress(this.endpoint.Id, ing)));
        this.Notifications.success('Success', `Ingress ${ingressesToUpdate.length > 1 ? 'rules' : 'rule'} successfully updated`);
      } catch (error) {
        this.Notifications.error('Failure', error, 'Unable to update ingress');
      }
    }

    try {
      this.state.actionInProgress = true;
      await this.KubernetesApplicationService.patch(this.savedFormValues, this.formValues, false, this.originalServicePorts);
      this.Notifications.success('Success', 'Request to update application successfully submitted');
      this.$state.go(
        'kubernetes.applications.application',
        { name: this.application.Name, namespace: this.application.ResourcePool, endpointId: this.endpoint.Id },
        { inherit: false }
      );
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update application');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  async confirmUpdateApplicationAsync() {
    const [ingressesToUpdate, servicePortsToUpdate] = await this.checkIngressesToUpdate();
    // if there is an ingressesToUpdate, then show a warning modal with asking if they want to update the ingresses
    if (ingressesToUpdate.length) {
      const result = await confirmUpdateAppIngress(ingressesToUpdate, servicePortsToUpdate);
      if (!result) {
        return;
      }

      const { noMatch } = result;
      if (!noMatch) {
        return this.$async(this.updateApplicationAsync, []);
      }
      if (noMatch) {
        return this.$async(this.updateApplicationAsync, ingressesToUpdate);
      }
    } else {
      confirmUpdate('Updating the application may cause a service interruption. Do you wish to continue?', (confirmed) => {
        if (confirmed) {
          return this.$async(this.updateApplicationAsync, []);
        }
      });
    }
  }

  // check if service ports with ingresses have changed and allow the user to update the ingress to the new port values with a modal
  async checkIngressesToUpdate() {
    let ingressesToUpdate = [];
    let servicePortsToUpdate = [];
    const fullIngresses = await getIngresses(this.endpoint.Id);
    this.formValues.Services.forEach((updatedService) => {
      const oldServiceIndex = this.oldFormValues.Services.findIndex((oldService) => oldService.Name === updatedService.Name);
      const numberOfPortsInOldService = this.oldFormValues.Services[oldServiceIndex] && this.oldFormValues.Services[oldServiceIndex].Ports.length;
      // if the service has an ingress and there is the same number of ports or more in the updated service
      if (updatedService.Ingress && numberOfPortsInOldService && numberOfPortsInOldService <= updatedService.Ports.length) {
        const updatedOldPorts = updatedService.Ports.slice(0, numberOfPortsInOldService);
        const ingressesForService = fullIngresses.filter((ing) => {
          if (ing.Paths) {
            const ingServiceNames = ing.Paths.map((path) => path.ServiceName);
            if (ingServiceNames.includes(updatedService.Name)) {
              return true;
            }
          }
        });
        ingressesForService.forEach((ingressForService) => {
          updatedOldPorts.forEach((servicePort, pIndex) => {
            if (servicePort.ingressPaths) {
              // if there isn't a ingress path that has a matching service name and port
              const doesIngressPathMatchServicePort = ingressForService.Paths.find((ingPath) => ingPath.ServiceName === updatedService.Name && ingPath.Port === servicePort.port);
              if (!doesIngressPathMatchServicePort) {
                // then find the ingress path index to update by looking for the matching port in the old form values
                const oldServicePort = this.oldFormValues.Services[oldServiceIndex].Ports[pIndex].port;
                const newServicePort = servicePort.port;

                const ingressPathIndex = ingressForService.Paths.findIndex((ingPath) => {
                  return ingPath.ServiceName === updatedService.Name && ingPath.Port === oldServicePort;
                });
                if (ingressPathIndex !== -1) {
                  // if the ingress to update isn't in the ingressesToUpdate list
                  const ingressUpdateIndex = ingressesToUpdate.findIndex((ing) => ing.Name === ingressForService.Name);
                  if (ingressUpdateIndex === -1) {
                    // then add it to the list with the new port
                    const ingressToUpdate = angular.copy(ingressForService);
                    ingressToUpdate.Paths[ingressPathIndex].Port = newServicePort;
                    ingressesToUpdate.push(ingressToUpdate);
                  } else {
                    // if the ingress is already in the list, then update the path with the new port
                    ingressesToUpdate[ingressUpdateIndex].Paths[ingressPathIndex].Port = newServicePort;
                  }
                  if (!servicePortsToUpdate.includes(newServicePort)) {
                    servicePortsToUpdate.push(newServicePort);
                  }
                }
              }
            }
          });
        });
      }
    });
    return [ingressesToUpdate, servicePortsToUpdate];
  }

  deployApplication() {
    if (this.state.isEdit) {
      return this.$async(this.confirmUpdateApplicationAsync);
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
        this.endpoint = await this.EndpointService.endpoint(this.endpoint.Id);
        await this.StateManager.updateEndpointState(this.endpoint);

        this.storageClasses = this.endpoint.Kubernetes.Configuration.StorageClasses;
        this.state.useLoadBalancer = this.endpoint.Kubernetes.Configuration.UseLoadBalancer;
        this.state.useServerMetrics = this.endpoint.Kubernetes.Configuration.UseServerMetrics;

        this.deploymentOptions = await getGlobalDeploymentOptions();

        const [resourcePools, nodes, nodesLimits] = await Promise.all([
          this.KubernetesResourcePoolService.get(),
          this.KubernetesNodeService.get(),
          this.KubernetesNodesLimitsService.get(),
        ]);
        this.nodesLimits = nodesLimits;

        const nonSystemNamespaces = _.filter(
          resourcePools,
          (resourcePool) => !KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name) && resourcePool.Namespace.Status === 'Active'
        );

        this.allNamespaces = resourcePools.map(({ Namespace }) => Namespace.Name);
        this.resourcePools = _.sortBy(nonSystemNamespaces, ({ Namespace }) => (Namespace.Name === 'default' ? 0 : 1));

        // this.state.nodes.memory and this.state.nodes.cpu are used to calculate the slider limits, so set them before calling updateSliders()
        _.forEach(nodes, (item) => {
          this.state.nodes.memory += filesizeParser(item.Memory);
          this.state.nodes.cpu += item.CPU;
        });

        var namespace = '';
        this.formValues.ResourcePool = this.resourcePools[0];

        if (this.resourcePools.length) {
          if (this.state.isEdit) {
            namespace = this.$state.params.namespace;
            this.formValues.ResourcePool = _.find(this.resourcePools, ['Namespace.Name', namespace]);
          }

          namespace = this.formValues.ResourcePool.Namespace.Name;
          this.namespaceWithQuota = await this.KubernetesResourcePoolService.get(namespace);
          this.formValues.ResourcePool.Quota = this.namespaceWithQuota.Quota;

          // this.savedFormValues is being used in updateNamespaceLimits behind a check to see isEdit
          if (this.state.isEdit) {
            this.savedFormValues = angular.copy(this.formValues);
          }

          this.updateNamespaceLimits(this.namespaceWithQuota);
          this.updateSliders(this.namespaceWithQuota);
        }

        if (!this.formValues.ResourcePool) {
          return;
        }

        this.nodesLabels = KubernetesNodeHelper.generateNodeLabelsFromNodes(nodes);
        this.nodeNumber = nodes.length;

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

          this.formValues.Services = this.formValues.Services || [];
          this.originalServicePorts = structuredClone(this.formValues.Services.flatMap((service) => service.Ports));
          this.originalIngressPaths = structuredClone(this.originalServicePorts.flatMap((port) => port.ingressPaths).filter((ingressPath) => ingressPath.Host));

          if (this.formValues.CpuLimit) {
            this.state.isExistingCPUReservationUnchanged = true;
          }
          if (this.formValues.MemoryLimit) {
            this.state.isExistingMemoryReservationUnchanged = true;
          }

          if (this.application.ApplicationKind) {
            this.state.appType = KubernetesDeploymentTypes[this.application.ApplicationKind.toUpperCase()];
            if (this.application.ApplicationKind === KubernetesDeploymentTypes.URL) {
              this.state.appType = KubernetesDeploymentTypes.CONTENT;
            }

            if (this.application.StackId) {
              this.stack = await this.StackService.stack(this.application.StackId);
              if (this.state.appType === KubernetesDeploymentTypes.CONTENT) {
                this.stackFileContent = await this.StackService.getStackFile(this.application.StackId);
                this.oldStackFileContent = this.stackFileContent;
              }
            }
          }

          this.formValues.OriginalIngresses = this.ingresses;
          this.formValues.ImageModel = await this.parseImageConfiguration(this.formValues.ImageModel);

          if (this.application.ApplicationType !== KubernetesApplicationTypes.StatefulSet) {
            _.forEach(this.formValues.PersistedFolders, (persistedFolder) => {
              const volume = _.find(this.availableVolumes, ['PersistentVolumeClaim.Name', persistedFolder.persistentVolumeClaimName]);
              if (volume) {
                persistedFolder.useNewVolume = false;
                persistedFolder.existingVolume = volume;
              }
            });
          }
          this.formValues.OriginalPersistedFolders = this.formValues.PersistedFolders;
          await this.refreshNamespaceData(namespace);

          this.savedFormValues = angular.copy(this.formValues);
          this.updateNamespaceLimits(this.namespaceWithQuota);
          this.updateSliders(this.namespaceWithQuota);
        } else {
          this.formValues.AutoScaler = KubernetesApplicationHelper.generateAutoScalerFormValueFromHorizontalPodAutoScaler(null, this.formValues.ReplicaCount);
        }

        if (this.state.isEdit) {
          this.nodesLimits.excludesPods(this.application.Pods, this.formValues.CpuLimit, KubernetesResourceReservationHelper.bytesValue(this.formValues.MemoryLimit));

          // Workaround for EE-6118
          if (this.stack && !this.stack.EndpointId) {
            this.stack.EndpointId = this.endpoint.Id;
          }
        }

        this.oldFormValues = angular.copy(this.formValues);
        this.savedFormValues = angular.copy(this.formValues);
        this.updateNamespaceLimits(this.namespaceWithQuota);
        this.updateSliders(this.namespaceWithQuota);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load view data');
      } finally {
        this.state.viewReady = true;
      }
      // get all nodeport services in the cluster, to validate unique nodeports in the form
      // this is below the try catch, to not block the page rendering
      const allSettledServices = await Promise.allSettled(this.resourcePools.map((namespace) => getServices(this.endpoint.Id, namespace.Namespace.Name)));
      const allServices = allSettledServices
        .filter((settledService) => settledService.status === 'fulfilled' && settledService.value)
        .map((fulfilledService) => fulfilledService.value)
        .flat();
      this.state.nodePortServices = allServices.filter((service) => service.Type === 'NodePort');
    });
  }

  /* #endregion */
}

export default KubernetesCreateApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateApplicationController', KubernetesCreateApplicationController);
