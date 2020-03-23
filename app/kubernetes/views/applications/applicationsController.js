import angular from 'angular';
import _ from 'lodash-es';
import KubernetesStackHelper from 'Kubernetes/helpers/stackHelper';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';

class KubernetesApplicationsController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesApplicationService, Authentication, ModalService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.Authentication = Authentication;
    this.ModalService = ModalService;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.removeStacksAction = this.removeStacksAction.bind(this);
    this.removeStacksActionAsync = this.removeStacksActionAsync.bind(this);
    this.onPublishingModeClick = this.onPublishingModeClick.bind(this);
  }

  async removeStacksActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const stack of selectedItems) {
      try {
        const promises = _.map(stack.Applications, (app) => this.KubernetesApplicationService.delete(app));
        await Promise.all(promises);
        this.Notifications.success('Stack successfully removed', stack.Name);
        _.remove(this.stacks, {Name: stack.Name});
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
      });
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
    return this.$async(this.removeActionAsync, selectedItems);
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

  async getApplicationsAsync() {
    try {
      this.applications = await this.KubernetesApplicationService.get();
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
      activeTab: 0,
      isAdmin: this.Authentication.isAdmin()
    };

    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);