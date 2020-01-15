import angular from 'angular';
import {KubernetesApplicationDeploymentTypes} from 'Kubernetes/models/application';

class KubernetesApplicationController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getApplication = this.getApplication.bind(this);
    this.getApplicationAsync = this.getApplicationAsync.bind(this);
  }

  async getApplicationAsync() {
      try {
        this.state.dataLoading = true;
        const applicationName = this.$transition$.params().name;
        this.application = await this.KubernetesApplicationService.application(applicationName);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve application details');
      } finally {
        this.state.dataLoading = false;
      }
  }

  getApplication() {
    return this.$async(this.getApplicationAsync);
  }

  async onInit() {
    this.state = {
      activeTab: 0,
      DisplayedPanel: 'pods',
      eventsLoading: true,
      dataLoading: true
    };

    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.getApplication();
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationController', KubernetesApplicationController);