import angular from 'angular';
import _ from 'lodash-es';
import KubernetesStackHelper from 'Kubernetes/helpers/stackHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

class KubernetesApplicationsController2 {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.onPublishingModeClick = this.onPublishingModeClick.bind(this);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const application of selectedItems) {
      try {
        await this.KubernetesApplicationService.remove(application);
        this.Notifications.success('Application successfully removed', application.Name);
        const index = this.applications.indexOf(application);
        this.applications.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove application');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  onPublishingModeClick(application) {
    this.state.activeTab = 1;
    _.forEach(this.ports, (item) => {
      item.Expanded = false;
      item.Highlighted = false;
      if (item.ApplicationName === application.Name) {
        if (item.Ports.length > 1) {
          item.Expanded = true;
        }
        item.Highlighted = true;
      }
    });
  }

  removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  async getApplicationsAsync() {
    try {
      this.applications = await this.KubernetesApplicationService.applications();
      this.stacks = KubernetesStackHelper.stacksFromApplications(this.applications);
      this.ports = KubernetesApplicationHelper.portMappingsFromApplications(this.applications);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.getApplications();
  }

  $onInit() {
    this.state = {
      activeTab: 0
    };

    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationsController2;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController2', KubernetesApplicationsController2);