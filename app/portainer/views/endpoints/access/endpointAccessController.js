import angular from "angular";

class EndpointAccessController {
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
    this.state = {actionInProgress: false};
    try {
      this.endpoint = await this.EndpointService.endpoint(
        this.$transition$.params().id
      );
      this.group = await this.GroupService.group(this.endpoint.GroupId);
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable to retrieve endpoint information");
    }
  }

  updateAccess() {
    return this.$async(this.updateAccessAsync);
  }

  async updateAccessAsync() {
    try {
      this.state.actionInProgress = true;
      await this.EndpointService.updateEndpoint(this.$transition$.params().id, this.endpoint);
      this.Notifications.success("Access successfully updated");
      this.$state.reload();
    } catch (err) {
      this.state.actionInProgress = false;
      this.Notifications.error("Failure", err, "Unable to update accesses");
    }
  }
}

export default EndpointAccessController;
angular
  .module("portainer.app")
  .controller("EndpointAccessController", EndpointAccessController);
