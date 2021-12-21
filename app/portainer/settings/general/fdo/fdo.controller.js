import { configureFDO } from "@/portainer/services/api/hostmanagement/fdo.service";

class FDOController {
  /* @ngInject */
  constructor($async, $scope, $state, SettingsService, Notifications) {
    Object.assign(this, { $async, $scope, $state, SettingsService, Notifications });

    this.formValues = {
      enabled: false,
      ownerURL: '',
      ownerUsername: '',
      ownerPassword: '',
    };

    this.originalValues = {
      ...this.formValues,
    };

    this.state = {
      actionInProgress: false,
    };

    this.save = this.save.bind(this);
    this.onChangeEnableFDO = this.onChangeEnableFDO.bind(this);
  }

  onChangeEnableFDO(checked) {
    return this.$scope.$evalAsync(() => {
      this.formValues.enabled = checked;
    });
  }

  isFormChanged() {
    return Object.entries(this.originalValues).some(([key, value]) => value !== this.formValues[key]);
  }

  async save() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        await configureFDO(this.formValues);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.Notifications.success(`FDO successfully ${this.formValues.enabled ? 'enabled' : 'disabled'}`);
        this.originalValues = {
          ...this.formValues,
        };
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed applying changes');
      }
      this.state.actionInProgress = false;
    });
  }

  async $onInit() {
    return this.$async(async () => {
      try {
        const data = await this.SettingsService.settings();
        const config = data.FDOConfiguration;

        if (config) {
          this.formValues = {
            ...this.formValues,
            enabled: config.Enabled,
            ownerURL: config.OwnerURL,
            ownerUsername: config.OwnerUsername,
            ownerPassword: config.OwnerPassword,
          };

          this.originalValues = {
            ...this.formValues,
          };
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading settings');
      }
    });
  }
}

export default FDOController;
