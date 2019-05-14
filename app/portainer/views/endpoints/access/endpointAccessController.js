import angular from "angular";

class EndpointAccessController {
  /* @ngInject */
  constructor($state, $transition$, Notifications, EndpointService, GroupService) {
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
  }

  async $onInit() {
    try {
      this.endpoint = await this.EndpointService.endpoint(
        this.$transition$.params().id
      );
      this.group = await this.GroupService.group(this.endpoint.GroupId);
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable to retrieve endpoint information");
    }
  }

  async updateAccess(authorizedUsers, authorizedTeams) {
    try {
      await this.EndpointService.updateAccess(
        this.$transition$.params().id,
        authorizedUsers,
        authorizedTeams
      );
      this.Notifications.success("Accesses successfully updated");
      this.$state.reload();
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable to update accesses");
    }
  }
}

export default EndpointAccessController;
angular
  .module("portainer.app")
  .controller("EndpointAccessController", EndpointAccessController);
