require('../../templates/advancedDeploymentPanel.html');

import angular from 'angular';
import _ from 'lodash-es';
import KubernetesStackHelper from 'Kubernetes/helpers/stackHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';

class KubernetesApplicationsController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesApplicationService, Authentication, ModalService, LocalStorage) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.Authentication = Authentication;
    this.ModalService = ModalService;
    this.LocalStorage = LocalStorage;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.removeStacksAction = this.removeStacksAction.bind(this);
    this.removeStacksActionAsync = this.removeStacksActionAsync.bind(this);
    this.onPublishingModeClick = this.onPublishingModeClick.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('applications', index);
  }

  async removeStacksActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const stack of selectedItems) {
      try {
        const promises = _.map(stack.Applications, (app) => this.KubernetesApplicationService.delete(app));
        await Promise.all(promises);
        this.Notifications.success('Stack successfully removed', stack.Name);
        _.remove(this.stacks, { Name: stack.Name });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove stack');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  removeStacksAction(selectedItems) {
    this.ModalService.confirmDeletion(
      'Are you sure that you want to remove the selected stack(s) ? This will remove all the applications associated to the stack(s).',
      (confirmed) => {
        if (confirmed) {
          return this.$async(this.removeStacksActionAsync, selectedItems);
        }
      }
    );
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const application of selectedItems) {
      try {
        await this.KubernetesApplicationService.delete(application);
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

  removeAction(selectedItems) {
    this.ModalService.confirmDeletion('Do you want to remove the selected application(s)?', (confirmed) => {
      if (confirmed) {
        return this.$async(this.removeActionAsync, selectedItems);
      }
    });
  }

  onPublishingModeClick(application) {
    this.state.activeTab = 1;
    _.forEach(this.ports, (item) => {
      item.Expanded = false;
      item.Highlighted = false;
      if (item.Name === application.Name && item.Ports.length > 1) {
        item.Expanded = true;
        item.Highlighted = true;
      }
    });
  }

  async getApplicationsAsync() {
    try {
      const applications = await this.KubernetesApplicationService.get();
      this.applications = applications;
      this.stacks = KubernetesStackHelper.stacksFromApplications(applications);
      this.ports = KubernetesApplicationHelper.portMappingsFromApplications(applications);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.state = {
      activeTab: this.LocalStorage.getActiveTab('applications'),
      currentName: this.$state.$current.name,
      isAdmin: this.Authentication.isAdmin(),
      viewReady: false,
    };

    await this.getApplications();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('applications', 0);
    }
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);
