import { RepositoryMechanismTypes } from 'Kubernetes/models/deploy';
import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';
import { parseAutoUpdateResponse } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { baseStackWebhookUrl } from '@/portainer/helpers/webhookHelper';

class KubernetesRedeployAppGitFormController {
  /* @ngInject */
  constructor($async, $state, StackService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.StackService = StackService;
    this.Notifications = Notifications;

    this.state = {
      saveGitSettingsInProgress: false,
      redeployInProgress: false,
      showConfig: false,
      isEdit: false,
      hasUnsavedChanges: false,
      baseWebhookUrl: baseStackWebhookUrl(),
    };

    this.formValues = {
      RefName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      // auto update
      AutoUpdate: parseAutoUpdateResponse(),
    };

    this.onChange = this.onChange.bind(this);
    this.onChangeRef = this.onChangeRef.bind(this);
    this.onChangeAutoUpdate = this.onChangeAutoUpdate.bind(this);
    this.onChangeGitAuth = this.onChangeGitAuth.bind(this);
  }

  onChangeRef(value) {
    this.onChange({ RefName: value });
  }

  async onChange(values) {
    return this.$async(async () => {
      this.formValues = {
        ...this.formValues,
        ...values,
      };

      this.state.hasUnsavedChanges = angular.toJson(this.savedFormValues) !== angular.toJson(this.formValues);
    });
  }

  onChangeGitAuth(values) {
    return this.$async(async () => {
      this.onChange(values);
    });
  }

  async onChangeAutoUpdate(values) {
    return this.$async(async () => {
      await this.onChange({
        AutoUpdate: {
          ...this.formValues.AutoUpdate,
          ...values,
        },
      });
    });
  }

  buildAnalyticsProperties() {
    const metadata = {
      'automatic-updates': automaticUpdatesLabel(this.formValues.AutoUpdate.RepositoryAutomaticUpdates, this.formValues.AutoUpdate.RepositoryMechanism),
    };

    return { metadata };

    function automaticUpdatesLabel(repositoryAutomaticUpdates, repositoryMechanism) {
      switch (repositoryAutomaticUpdates && repositoryMechanism) {
        case RepositoryMechanismTypes.INTERVAL:
          return 'polling';
        case RepositoryMechanismTypes.WEBHOOK:
          return 'webhook';
        default:
          return 'off';
      }
    }
  }

  async pullAndRedeployApplication() {
    return this.$async(async () => {
      try {
        const confirmed = await confirm({
          title: 'Are you sure?',
          message: 'Any changes to this application will be overridden by the definition in git and may cause a service interruption. Do you wish to continue?',
          confirmButton: buildConfirmButton('Update', 'warning'),
          modalType: ModalType.Warn,
        });
        if (!confirmed) {
          return;
        }

        this.state.redeployInProgress = true;
        await this.StackService.updateKubeGit(this.stack.Id, this.stack.EndpointId, this.namespace, this.formValues);
        this.Notifications.success('Success', 'Pulled and redeployed stack successfully');
        await this.$state.reload();
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
        this.savedFormValues = angular.copy(this.formValues);
        this.state.hasUnsavedChanges = false;
        this.Notifications.success('Success', 'Save stack settings successfully');
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

    this.formValues.AutoUpdate = parseAutoUpdateResponse(this.stack.AutoUpdate);

    if (this.stack.GitConfig && this.stack.GitConfig.Authentication) {
      this.formValues.RepositoryUsername = this.stack.GitConfig.Authentication.Username;
      this.formValues.RepositoryAuthentication = true;
      this.state.isEdit = true;
    }

    this.savedFormValues = angular.copy(this.formValues);
  }
}

export default KubernetesRedeployAppGitFormController;
