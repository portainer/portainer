import _ from "lodash-es";

import angular from "angular";

class PorAccessManagementController {
  /* @ngInject */
  constructor(Notifications, ExtensionService, AccessService, RoleService) {
    this.Notifications = Notifications;
    this.ExtensionService = ExtensionService;
    this.AccessService = AccessService;
    this.RoleService = RoleService;
    
    this.unauthorizeAccess = this.unauthorizeAccess.bind(this);
  }

  authorizeAccess() {
    const entity = this.accessControlledEntity;
    const oldUserAccessPolicies = entity && entity.UserAccessPolicies ? entity.UserAccessPolicies : {};
    const oldTeamAccessPolicies = entity && entity.TeamAccessPolicies ? entity.TeamAccessPolicies : {};
    const selectedRole = this.rbacEnabled ? this.formValues.selectedRole.Id : 0;
    const selectedUserAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === "user");
    const selectedTeamAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === "team");
    const accessPolicies = this.AccessService.generateAccessPolicies(oldUserAccessPolicies, oldTeamAccessPolicies, selectedUserAccesses, selectedTeamAccesses, selectedRole);
    this.updateAccess(accessPolicies);
  }

  unauthorizeAccess(selectedAccesses) {
    const entity = this.accessControlledEntity;
    const userAccessPolicies = entity && entity.UserAccessPolicies ? entity.UserAccessPolicies : {};
    const teamAccessPolicies = entity && entity.TeamAccessPolicies ? entity.TeamAccessPolicies : {};
    const selectedUserAccesses = _.filter(selectedAccesses, (access) => access.Type === "user");
    const selectedTeamAccesses = _.filter(selectedAccesses, (access) => access.Type === "team");
    _.forEach(selectedUserAccesses, (access) => delete userAccessPolicies[access.Id]);
    _.forEach(selectedTeamAccesses, (access) => delete teamAccessPolicies[access.Id]);
    const accessPolicies = {
      userAccessPolicies: userAccessPolicies,
      teamAccessPolicies: teamAccessPolicies
    }
    this.updateAccess(accessPolicies);
  }

  async $onInit() {
    const entity = this.accessControlledEntity;
    const parent = this.inheritFrom;
    this.roles = [];
    this.rbacEnabled = false;
    try {
      this.rbacEnabled = await this.ExtensionService.extensionEnabled(
        this.ExtensionService.EXTENSIONS.RBAC
      );
      if (this.rbacEnabled) {
        this.roles = await this.RoleService.roles();
        this.formValues = {
          selectedRole: this.roles[0]
        };
      }
      const data = await this.AccessService.accesses(
        entity && entity.UserAccessPolicies ? entity.UserAccessPolicies : {},
        entity && entity.TeamAccessPolicies ? entity.TeamAccessPolicies : {},
        parent && parent.UserAccessPolicies ? parent.UserAccessPolicies : {},
        parent && parent.TeamAccessPolicies ? parent.TeamAccessPolicies : {},
        this.roles
      );
      this.availableUsersAndTeams = data.availableUsersAndTeams;
      this.authorizedUsersAndTeams = data.authorizedUsersAndTeams;
    } catch (err) {
      this.availableUsersAndTeams = [];
      this.authorizedUsersAndTeams = [];
      this.Notifications.error("Failure", err, "Unable to retrieve accesses");
    }
  }
}

export default PorAccessManagementController;
angular
  .module("portainer.app")
  .controller("porAccessManagementController", PorAccessManagementController);
