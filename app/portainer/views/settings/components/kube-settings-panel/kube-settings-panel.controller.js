import { FeatureId } from '@/react/portainer/feature-flags/enums';

/* @ngInject */
export default function KubeSettingsPanelController($scope, $async) {
  this.onToggleAddWithForm = onToggleAddWithForm.bind(this);
  this.onToggleHideWebEditor = onToggleHideWebEditor.bind(this);
  this.onToggleHideFileUpload = onToggleHideFileUpload.bind(this);
  this.onTogglePerEnvOverride = onTogglePerEnvOverride.bind(this);
  this.saveKubernetesSettings = saveKubernetesSettings.bind(this);
  this.onToggleNoteOnApplications = onToggleNoteOnApplications.bind(this);
  this.$onInit = $onInit.bind(this);

  this.enforceDeploymentOptions = FeatureId.ENFORCE_DEPLOYMENT_OPTIONS;

  this.state = {
    availableKubeconfigExpiryOptions: [
      {
        key: '1 day',
        value: '24h',
      },
      {
        key: '7 days',
        value: `${24 * 7}h`,
      },
      {
        key: '30 days',
        value: `${24 * 30}h`,
      },
      {
        key: '1 year',
        value: `${24 * 30 * 12}h`,
      },
      {
        key: 'No expiry',
        value: '0',
      },
    ],
    actionInProgress: false,
  };

  this.formValues = {
    KubeconfigExpiry: undefined,
    HelmRepositoryURL: undefined,
    GlobalDeploymentOptions: {
      hideAddWithForm: false,
      perEnvOverride: false,
      hideWebEditor: false,
      hideFileUpload: false,
    },
  };

  function onToggleAddWithForm(checked) {
    $scope.$evalAsync(() => {
      this.formValues.GlobalDeploymentOptions.hideAddWithForm = checked;
      this.formValues.GlobalDeploymentOptions.hideWebEditor = false;
      this.formValues.GlobalDeploymentOptions.hideFileUpload = false;
      if (checked) {
        this.formValues.GlobalDeploymentOptions.hideWebEditor = true;
        this.formValues.GlobalDeploymentOptions.hideFileUpload = true;
      }
    });
  }

  function onToggleHideWebEditor(checked) {
    $scope.$evalAsync(() => {
      this.formValues.GlobalDeploymentOptions.hideWebEditor = !checked;
    });
  }

  function onToggleHideFileUpload(checked) {
    $scope.$evalAsync(() => {
      this.formValues.GlobalDeploymentOptions.hideFileUpload = !checked;
    });
  }

  function onTogglePerEnvOverride(checked) {
    $scope.$evalAsync(() => {
      this.formValues.GlobalDeploymentOptions.perEnvOverride = checked;
    });
  }

  function onToggleNoteOnApplications(checked) {
    $scope.$evalAsync(() => {
      this.formValues.GlobalDeploymentOptions.requireNoteOnApplications = checked;
    });
  }

  async function saveKubernetesSettings() {
    $async(async () => {
      this.state.actionInProgress = true;
      await this.onSubmit(this.formValues, 'Kubernetes settings updated');
      this.state.actionInProgress = false;
    });
  }

  function $onInit() {
    if (this.settings.GlobalDeploymentOptions) {
      this.formValues.GlobalDeploymentOptions = this.settings.GlobalDeploymentOptions;
    }
    this.formValues.KubeconfigExpiry = this.settings.KubeconfigExpiry;
    this.formValues.HelmRepositoryURL = this.settings.HelmRepositoryURL;
  }
}
