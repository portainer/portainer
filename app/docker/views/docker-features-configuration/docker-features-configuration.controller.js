export default class DockerFeaturesConfigurationController {
  constructor($async, EndpointService, Notifications) {
    this.$async = $async;
    this.EndpointService = EndpointService;
    this.Notifications = Notifications;

    this.formValues = {
      enableHostManagementFeatures: false,
      allowVolumeBrowserForRegularUsers: false,
      disableBindMountsForRegularUsers: false,
      disablePrivilegedModeForRegularUsers: false,
      disableHostNamespaceForRegularUsers: false,
      disableStackManagementForRegularUsers: false,
      disableDeviceMappingForRegularUsers: false,
      disableContainerCapabilitiesForRegularUsers: false,
    };

    this.state = {
      actionInProgress: false,
    };
  }

  isContainerEditDisabled() {
    const {
      disableBindMountsForRegularUsers,
      disableHostNamespaceForRegularUsers,
      disablePrivilegedModeForRegularUsers,
      disableDeviceMappingForRegularUsers,
      disableContainerCapabilitiesForRegularUsers,
    } = this.formValues;
    return (
      disableBindMountsForRegularUsers ||
      disableHostNamespaceForRegularUsers ||
      disablePrivilegedModeForRegularUsers ||
      disableDeviceMappingForRegularUsers ||
      disableContainerCapabilitiesForRegularUsers
    );
  }

  async save() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;
        await this.EndpointService.updateSecuritySettings(this.endpoint.Id, {
          enableHostManagementFeatures: this.formValues.enableHostManagementFeatures,
          allowBindMountsForRegularUsers: !this.formValues.disableBindMountsForRegularUsers,
          allowPrivilegedModeForRegularUsers: !this.formValues.disablePrivilegedModeForRegularUsers,
          allowVolumeBrowserForRegularUsers: !this.formValues.allowVolumeBrowserForRegularUsers,
          allowHostNamespaceForRegularUsers: !this.formValues.disableHostNamespaceForRegularUsers,
          allowDeviceMappingForRegularUsers: !this.formValues.disableDeviceMappingForRegularUsers,
          allowStackManagementForRegularUsers: !this.formValues.disableStackManagementForRegularUsers,
          allowContainerCapabilitiesForRegularUsers: !this.formValues.disableContainerCapabilitiesForRegularUsers,
        });
      } catch (e) {
        this.Notifications.error('Failure', e, 'Failed saving settings');
      }
      this.state.actionInProgress = false;
    });
  }

  $onInit() {
    const securitySettings = this.endpoint.SecuritySettings;

    this.formValues = {
      enableHostManagementFeatures: securitySettings.enableHostManagementFeatures,
      allowVolumeBrowserForRegularUsers: !securitySettings.allowVolumeBrowserForRegularUsers,
      disableBindMountsForRegularUsers: !securitySettings.allowBindMountsForRegularUsers,
      disablePrivilegedModeForRegularUsers: !securitySettings.allowPrivilegedModeForRegularUsers,
      disableHostNamespaceForRegularUsers: !securitySettings.allowHostNamespaceForRegularUsers,
      disableDeviceMappingForRegularUsers: !securitySettings.allowDeviceMappingForRegularUsers,
      disableStackManagementForRegularUsers: !securitySettings.allowStackManagementForRegularUsers,
      disableContainerCapabilitiesForRegularUsers: !securitySettings.allowContainerCapabilitiesForRegularUsers,
    };
  }
}
