import { FeatureId } from '@/react/portainer/feature-flags/enums';

export default class DockerFeaturesConfigurationController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, Notifications, StateManager) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.Notifications = Notifications;
    this.StateManager = StateManager;

    this.limitedFeature = FeatureId.HIDE_AUTO_UPDATE_WINDOW;

    this.formValues = {
      enableHostManagementFeatures: false,
      allowVolumeBrowserForRegularUsers: false,
      disableBindMountsForRegularUsers: false,
      disablePrivilegedModeForRegularUsers: false,
      disableHostNamespaceForRegularUsers: false,
      disableStackManagementForRegularUsers: false,
      disableDeviceMappingForRegularUsers: false,
      disableContainerCapabilitiesForRegularUsers: false,
      disableSysctlSettingForRegularUsers: false,
    };

    this.isAgent = false;

    this.state = {
      actionInProgress: false,
      autoUpdateSettings: { Enabled: false },
      timeZone: '',
    };

    this.save = this.save.bind(this);
    this.onChangeField = this.onChangeField.bind(this);
    this.onToggleAutoUpdate = this.onToggleAutoUpdate.bind(this);
    this.onToggleGPUManagement = this.onToggleGPUManagement.bind(this);
    this.onGpusChange = this.onGpusChange.bind(this);
    this.onChangeEnableHostManagementFeatures = this.onChangeField('enableHostManagementFeatures');
    this.onChangeAllowVolumeBrowserForRegularUsers = this.onChangeField('allowVolumeBrowserForRegularUsers');
    this.onChangeDisableBindMountsForRegularUsers = this.onChangeField('disableBindMountsForRegularUsers');
    this.onChangeDisablePrivilegedModeForRegularUsers = this.onChangeField('disablePrivilegedModeForRegularUsers');
    this.onChangeDisableHostNamespaceForRegularUsers = this.onChangeField('disableHostNamespaceForRegularUsers');
    this.onChangeDisableStackManagementForRegularUsers = this.onChangeField('disableStackManagementForRegularUsers');
    this.onChangeDisableDeviceMappingForRegularUsers = this.onChangeField('disableDeviceMappingForRegularUsers');
    this.onChangeDisableContainerCapabilitiesForRegularUsers = this.onChangeField('disableContainerCapabilitiesForRegularUsers');
    this.onChangeDisableSysctlSettingForRegularUsers = this.onChangeField('disableSysctlSettingForRegularUsers');
  }

  onToggleAutoUpdate(value) {
    return this.$scope.$evalAsync(() => {
      this.state.autoUpdateSettings.Enabled = value;
    });
  }

  onToggleGPUManagement(checked) {
    this.$scope.$evalAsync(() => {
      this.state.enableGPUManagement = checked;
    });
  }

  onChange(values) {
    return this.$scope.$evalAsync(() => {
      this.formValues = {
        ...this.formValues,
        ...values,
      };
    });
  }

  onChangeField(field) {
    return (value) => {
      this.onChange({
        [field]: value,
      });
    };
  }

  onGpusChange(value) {
    return this.$async(async () => {
      this.endpoint.Gpus = value;
    });
  }

  isContainerEditDisabled() {
    const {
      disableBindMountsForRegularUsers,
      disableHostNamespaceForRegularUsers,
      disablePrivilegedModeForRegularUsers,
      disableDeviceMappingForRegularUsers,
      disableContainerCapabilitiesForRegularUsers,
      disableSysctlSettingForRegularUsers,
    } = this.formValues;
    return (
      disableBindMountsForRegularUsers ||
      disableHostNamespaceForRegularUsers ||
      disablePrivilegedModeForRegularUsers ||
      disableDeviceMappingForRegularUsers ||
      disableContainerCapabilitiesForRegularUsers ||
      disableSysctlSettingForRegularUsers
    );
  }

  async save() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;

        const validGpus = this.endpoint.Gpus.filter((gpu) => gpu.name && gpu.value);
        const gpus = this.state.enableGPUManagement ? validGpus : [];

        const settings = {
          enableHostManagementFeatures: this.formValues.enableHostManagementFeatures,
          allowBindMountsForRegularUsers: !this.formValues.disableBindMountsForRegularUsers,
          allowPrivilegedModeForRegularUsers: !this.formValues.disablePrivilegedModeForRegularUsers,
          allowVolumeBrowserForRegularUsers: this.formValues.allowVolumeBrowserForRegularUsers,
          allowHostNamespaceForRegularUsers: !this.formValues.disableHostNamespaceForRegularUsers,
          allowDeviceMappingForRegularUsers: !this.formValues.disableDeviceMappingForRegularUsers,
          allowStackManagementForRegularUsers: !this.formValues.disableStackManagementForRegularUsers,
          allowContainerCapabilitiesForRegularUsers: !this.formValues.disableContainerCapabilitiesForRegularUsers,
          allowSysctlSettingForRegularUsers: !this.formValues.disableSysctlSettingForRegularUsers,
          enableGPUManagement: this.state.enableGPUManagement,
          gpus,
        };

        await this.EndpointService.updateSecuritySettings(this.endpoint.Id, settings);

        this.endpoint.SecuritySettings = settings;
        this.Notifications.success('Success', 'Saved settings successfully');
      } catch (e) {
        this.Notifications.error('Failure', e, 'Failed saving settings');
      }
      this.state.actionInProgress = false;
      this.$state.reload();
    });
  }

  $onInit() {
    const securitySettings = this.endpoint.SecuritySettings;

    const applicationState = this.StateManager.getState();
    this.isAgent = applicationState.endpoint.mode.agentProxy;

    this.isDockerStandaloneEnv = applicationState.endpoint.mode.provider === 'DOCKER_STANDALONE';

    this.formValues = {
      enableHostManagementFeatures: this.isAgent && securitySettings.enableHostManagementFeatures,
      allowVolumeBrowserForRegularUsers: this.isAgent && securitySettings.allowVolumeBrowserForRegularUsers,
      disableBindMountsForRegularUsers: !securitySettings.allowBindMountsForRegularUsers,
      disablePrivilegedModeForRegularUsers: !securitySettings.allowPrivilegedModeForRegularUsers,
      disableHostNamespaceForRegularUsers: !securitySettings.allowHostNamespaceForRegularUsers,
      disableDeviceMappingForRegularUsers: !securitySettings.allowDeviceMappingForRegularUsers,
      disableStackManagementForRegularUsers: !securitySettings.allowStackManagementForRegularUsers,
      disableContainerCapabilitiesForRegularUsers: !securitySettings.allowContainerCapabilitiesForRegularUsers,
      disableSysctlSettingForRegularUsers: !securitySettings.allowSysctlSettingForRegularUsers,
    };

    this.state.enableGPUManagement = this.isDockerStandaloneEnv && (this.endpoint.EnableGPUManagement || this.endpoint.Gpus.length > 0);
  }
}
