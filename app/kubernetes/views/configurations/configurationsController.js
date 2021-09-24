import angular from 'angular';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';

class KubernetesConfigurationsController {
  /* @ngInject */
  constructor($async, $state, Notifications, Authentication, KubernetesConfigurationService, KubernetesApplicationService, ModalService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.ModalService = ModalService;

    this.onInit = this.onInit.bind(this);
    this.getConfigurations = this.getConfigurations.bind(this);
    this.getConfigurationsAsync = this.getConfigurationsAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.refreshCallback = this.refreshCallback.bind(this);
    this.refreshCallbackAsync = this.refreshCallbackAsync.bind(this);
  }

  async getConfigurationsAsync() {
    try {
      this.state.configurationsLoading = true;
      this.configurations = await this.KubernetesConfigurationService.get();
      KubernetesConfigurationHelper.setConfigurationsUsed(this.configurations, this.applications);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
    } finally {
      this.state.configurationsLoading = false;
    }
  }

  getConfigurations() {
    return this.$async(this.getConfigurationsAsync);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const configuration of selectedItems) {
      try {
        await this.KubernetesConfigurationService.delete(configuration);
        this.Notifications.success('Configurations successfully removed', configuration.Name);
        const index = this.configurations.indexOf(configuration);
        this.configurations.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove configuration');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload(this.$state.current);
        }
      }
    }
  }

  removeAction(selectedItems) {
    this.ModalService.confirmDeletion('Do you want to remove the selected configuration(s)?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.removeActionAsync, selectedItems);
      }
    });
  }

  async getApplicationsAsync() {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async refreshCallbackAsync() {
    await this.getConfigurations();
    await this.getApplications();
  }

  refreshCallback() {
    return this.$async(this.refreshCallbackAsync);
  }

  async onInit() {
    this.state = {
      configurationsLoading: true,
      applicationsLoading: true,
      viewReady: false,
      isAdmin: this.Authentication.isAdmin(),
    };

    await this.getApplications();
    await this.getConfigurations();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesConfigurationsController;
angular.module('portainer.kubernetes').controller('KubernetesConfigurationsController', KubernetesConfigurationsController);
