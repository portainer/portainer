class KubernetesAppGitFormController {
  /* @ngInject */
  constructor($async, $state, StackService, ModalService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.StackService = StackService;
    this.ModalService = ModalService;
    this.Notifications = Notifications;

    this.state = {
      saveGitSettingsInProgress: false,
      redeployInProgress: false,
      showConfig: true,
      isEdit: false,
    };

    this.formValues = {
      RefName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
    };

    this.onChange = this.onChange.bind(this);
    this.onChangeRef = this.onChangeRef.bind(this);
  }

  onChangeRef(value) {
    this.onChange({ RefName: value });
  }

  onChange(values) {
    this.formValues = {
      ...this.formValues,
      ...values,
    };
  }

  async pullAndRedeployApplication() {
    return this.$async(async () => {
      try {
        const confirmed = await this.ModalService.confirmAsync({
          title: 'Are you sure?',
          message: 'Any changes to this application will be overriden by the definition in git and may cause a service interruption. Do you wish to continue?',
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
        this.state.redeployInProgress = true;
        await this.StackService.updateKubeGit(this.stack.Id, this.stack.EndpointId, this.namespace, this.formValues);
        this.Notifications.success('Pulled and redeployed stack successfully');
        await this.$state.reload(this.$state.current);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed redeploying application');
      } finally {
        this.state.redeployInProgress = false;
      }
    });
  }

  async saveGitSettings() {
    return this.$async(async () => {
      try {
        this.state.saveGitSettingsInProgress = true;
        await this.StackService.updateKubeStack({ EndpointId: this.stack.EndpointId, Id: this.stack.Id }, null, this.formValues);
        this.Notifications.success('Save stack settings successfully');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to save application settings');
      } finally {
        this.state.saveGitSettingsInProgress = false;
      }
    });
  }

  isSubmitButtonDisabled() {
    return this.state.saveGitSettingsInProgress || this.state.redeployInProgress;
  }

  $onInit() {
    this.formValues.RefName = this.stack.GitConfig.ReferenceName;
    if (this.stack.GitConfig && this.stack.GitConfig.Authentication) {
      this.formValues.RepositoryUsername = this.stack.GitConfig.Authentication.Username;
      this.formValues.RepositoryAuthentication = true;
      this.state.isEdit = true;
    }
  }
}

export default KubernetesAppGitFormController;
