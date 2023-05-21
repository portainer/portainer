import { FeatureId } from '@/react/portainer/feature-flags/enums';

/* @ngInject */
export default function ApplicationSettingsPanelController($scope, $async, StateManager) {
  this.saveApplicationSettings = saveApplicationSettings.bind(this);
  this.onChangeCheckInInterval = onChangeCheckInInterval.bind(this);
  this.onToggleCustomLogo = onToggleCustomLogo.bind(this);
  this.$onInit = $onInit.bind(this);
  this.onToggleEnableTelemetry = onToggleEnableTelemetry.bind(this);
  this.onToggleCustomLoginBanner = onToggleCustomLoginBanner.bind(this);
  this.onChangeFormValues = onChangeFormValues.bind(this);

  this.customBannerFeatureId = FeatureId.CUSTOM_LOGIN_BANNER;

  this.formValues = {
    logoURL: '',
    logoEnabled: false,
    customLoginBannerEnabled: false,
    customLoginBanner: '',
    snapshotInterval: '',
    enableTelemetry: false,
    templatesUrl: '',
    edgeAgentCheckinInterval: '',
  };

  this.state = {
    isDemo: false,
    actionInProgress: false,
  };

  async function saveApplicationSettings() {
    $async(async () => {
      const appSettingsPayload = {
        SnapshotInterval: this.settings.SnapshotInterval,
        LogoURL: this.formValues.customLogo ? this.settings.LogoURL : '',
        EnableTelemetry: this.settings.EnableTelemetry,
        CustomLoginBanner: this.formValues.customLoginBanner ? this.settings.CustomLoginBanner : '',
        TemplatesURL: this.settings.TemplatesURL,
        EdgeAgentCheckinInterval: this.settings.EdgeAgentCheckinInterval,
      };

      this.state.actionInProgress = true;
      await this.onSubmit(appSettingsPayload, 'Application settings updated');
      this.state.actionInProgress = false;
    });
  }

  function onToggleCustomLogo(logoEnabled) {
    this.onChangeFormValues({ logoEnabled });
  }

  function onChangeCheckInInterval(edgeAgentCheckinInterval) {
    this.onChangeFormValues({ edgeAgentCheckinInterval });
  }

  function onToggleEnableTelemetry(enableTelemetry) {
    this.onChangeFormValues({ enableTelemetry });
  }

  function onToggleCustomLoginBanner(customLoginBannerEnabled) {
    this.onChangeFormValues({ customLoginBannerEnabled });
  }

  function onChangeFormValues(newPartialValues) {
    $scope.$evalAsync(() => {
      this.formValues = {
        ...this.formValues,
        ...newPartialValues,
      };
    });
  }

  function $onInit() {
    const state = StateManager.getState();
    this.state.isDemo = state.application.demoEnvironment.enabled;

    this.formValues = {
      logoURL: this.settings.LogoURL,
      logoEnabled: !!this.settings.LogoURL,
      customLoginBannerEnabled: !!this.settings.CustomLoginBanner,
      customLoginBanner: this.settings.CustomLoginBanner,
      snapshotInterval: this.settings.SnapshotInterval,
      enableTelemetry: this.settings.EnableTelemetry,
      templatesUrl: this.settings.TemplatesURL,
      edgeAgentCheckinInterval: this.settings.EdgeAgentCheckinInterval,
    };
  }
}
