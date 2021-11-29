import angular from 'angular';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, $transition$, Notifications, EndpointService, GroupService, $async) {
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
    this.$async = $async;

    this.updateAccess = this.updateAccess.bind(this);
    this.updateAccessAsync = this.updateAccessAsync.bind(this);
  }

  async $onInit() {
    this.state = { actionInProgress: false };
    try {

    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
    }
  }

  updateAccess() {
    return this.$async(this.updateAccessAsync);
  }

  async updateAccessAsync() {
    try {
      this.state.actionInProgress = true;
      await this.EndpointService.updateEndpoint(this.$transition$.params().id, this.endpoint);
      this.Notifications.success('Access successfully updated');
      this.$state.reload(this.$state.current);
    } catch (err) {
      this.state.actionInProgress = false;
      this.Notifications.error('Failure', err, 'Unable to update accesses');
    }
  }
}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
