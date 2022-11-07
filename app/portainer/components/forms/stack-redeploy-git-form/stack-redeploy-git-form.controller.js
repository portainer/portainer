import uuidv4 from 'uuid/v4';
import { RepositoryMechanismTypes } from 'Kubernetes/models/deploy';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { confirmStackUpdate } from '@/react/docker/stacks/common/confirm-stack-update';

class StackRedeployGitFormController {
  /* @ngInject */
  constructor($async, $state, $compile, $scope, StackService, Notifications, WebhookHelper, FormHelper) {
    this.$async = $async;
    this.$state = $state;
    this.$compile = $compile;
    this.$scope = $scope;
    this.StackService = StackService;
    this.Notifications = Notifications;
    this.WebhookHelper = WebhookHelper;
    this.FormHelper = FormHelper;
    $scope.stackPullImageFeature = FeatureId.STACK_PULL_IMAGE;
    this.state = {
      inProgress: false,
      redeployInProgress: false,
      showConfig: false,
      isEdit: false,
      hasUnsavedChanges: false,
    };

    this.formValues = {
      RefName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      Env: [],
      PullImage: false,
      Option: {
        Prune: false,
      },
      // auto update
      AutoUpdate: {
        RepositoryAutomaticUpdates: false,
        RepositoryMechanism: RepositoryMechanismTypes.INTERVAL,
        RepositoryFetchInterval: '5m',
        RepositoryWebhookURL: '',
      },
    };

    this.onChange = this.onChange.bind(this);
    this.onChangeRef = this.onChangeRef.bind(this);
    this.onChangeAutoUpdate = this.onChangeAutoUpdate.bind(this);
    this.onChangeEnvVar = this.onChangeEnvVar.bind(this);
    this.onChangeOption = this.onChangeOption.bind(this);
  }

  buildAnalyticsProperties() {
    const metadata = {};

    if (this.formValues.RepositoryAutomaticUpdates) {
      metadata.automaticUpdates = autoSyncLabel(this.formValues.RepositoryMechanism);
    }
    return { metadata };

    function autoSyncLabel(type) {
      switch (type) {
        case RepositoryMechanismTypes.INTERVAL:
          return 'polling';
        case RepositoryMechanismTypes.WEBHOOK:
          return 'webhook';
      }
      return 'off';
    }
  }

  onChange(values) {
    this.formValues = {
      ...this.formValues,
      ...values,
    };

    this.state.hasUnsavedChanges = angular.toJson(this.savedFormValues) !== angular.toJson(this.formValues);
  }

  onChangeRef(value) {
    this.onChange({ RefName: value });
  }

  onChangeAutoUpdate(values) {
    this.onChange({
      AutoUpdate: {
        ...this.formValues.AutoUpdate,
        ...values,
      },
    });
  }

  onChangeEnvVar(value) {
    this.onChange({ Env: value });
  }

  onChangeOption(values) {
    this.onChange({
      Option: {
        ...this.formValues.Option,
        ...values,
      },
    });
  }

  async submit() {
    const isSwarmStack = this.stack.Type === 1;
    const that = this;
    confirmStackUpdate(
      'Any changes to this stack or application made locally in Portainer will be overridden, which may cause service interruption. Do you wish to continue?',
      isSwarmStack
    ).then(async function (result) {
      if (!result) {
        return;
      }
      try {
        that.state.redeployInProgress = true;
        await that.StackService.updateGit(
          that.stack.Id,
          that.stack.EndpointId,
          that.FormHelper.removeInvalidEnvVars(that.formValues.Env),
          that.formValues.Option.Prune,
          that.formValues,
          result.pullImage
        );

        that.Notifications.success('Success', 'Pulled and redeployed stack successfully');
        that.$state.reload();
      } catch (err) {
        that.Notifications.error('Failure', err, 'Failed redeploying stack');
      } finally {
        that.state.redeployInProgress = false;
      }
    });
  }

  async saveGitSettings() {
    return this.$async(async () => {
      try {
        this.state.inProgress = true;
        const stack = await this.StackService.updateGitStackSettings(
          this.stack.Id,
          this.stack.EndpointId,
          this.FormHelper.removeInvalidEnvVars(this.formValues.Env),
          this.formValues
        );
        this.savedFormValues = angular.copy(this.formValues);
        this.state.hasUnsavedChanges = false;
        this.Notifications.success('Success', 'Save stack settings successfully');

        this.stack = stack;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to save stack settings');
      } finally {
        this.state.inProgress = false;
      }
    });
  }

  isSubmitButtonDisabled() {
    return this.state.inProgress || this.state.redeployInProgress;
  }

  isAutoUpdateChanged() {
    const wasEnabled = !!(this.stack.AutoUpdate && (this.stack.AutoUpdate.Interval || this.stack.AutoUpdate.Webhook));
    const isEnabled = this.formValues.AutoUpdate.RepositoryAutomaticUpdates;
    return isEnabled !== wasEnabled;
  }

  $onInit() {
    this.formValues.RefName = this.model.ReferenceName;
    this.formValues.Env = this.stack.Env;
    if (this.stack.Option) {
      this.formValues.Option = this.stack.Option;
    }

    // Init auto update
    if (this.stack.AutoUpdate && (this.stack.AutoUpdate.Interval || this.stack.AutoUpdate.Webhook)) {
      this.formValues.AutoUpdate.RepositoryAutomaticUpdates = true;

      if (this.stack.AutoUpdate.Interval) {
        this.formValues.AutoUpdate.RepositoryMechanism = RepositoryMechanismTypes.INTERVAL;
        this.formValues.AutoUpdate.RepositoryFetchInterval = this.stack.AutoUpdate.Interval;
      } else if (this.stack.AutoUpdate.Webhook) {
        this.formValues.AutoUpdate.RepositoryMechanism = RepositoryMechanismTypes.WEBHOOK;
        this.formValues.AutoUpdate.RepositoryWebhookURL = this.WebhookHelper.returnStackWebhookUrl(this.stack.AutoUpdate.Webhook);
      }
    }

    if (!this.formValues.AutoUpdate.RepositoryWebhookURL) {
      this.formValues.AutoUpdate.RepositoryWebhookURL = this.WebhookHelper.returnStackWebhookUrl(uuidv4());
    }

    if (this.stack.GitConfig && this.stack.GitConfig.Authentication) {
      this.formValues.RepositoryUsername = this.stack.GitConfig.Authentication.Username;
      this.formValues.RepositoryAuthentication = true;
      this.state.isEdit = true;
    }

    this.savedFormValues = angular.copy(this.formValues);
  }
}

export default StackRedeployGitFormController;
