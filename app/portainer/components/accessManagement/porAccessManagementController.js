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

  _dispatchUserAndTeamIDs(accesses, users, teams) {
    angular.forEach(accesses, function(access) {
      if (access.Type === "user" && !access.Inherited) {
        users.push(access.Id);
      } else if (access.Type === "team" && !access.Inherited) {
        teams.push(access.Id);
      }
    });
  }

  _processAuthorizedIDs(accesses, authorizedAccesses) {
    var authorizedUserIDs = [];
    var authorizedTeamIDs = [];
    if (accesses) {
      this._dispatchUserAndTeamIDs(
        accesses,
        authorizedUserIDs,
        authorizedTeamIDs
      );
    }
    if (authorizedAccesses) {
      this._dispatchUserAndTeamIDs(
        authorizedAccesses,
        authorizedUserIDs,
        authorizedTeamIDs
      );
    }
    return {
      userIDs: authorizedUserIDs,
      teamIDs: authorizedTeamIDs
    };
  }

  _removeFromAccesses(access, accesses) {
    _.remove(accesses, function(n) {
      return n.Id === access.Id && n.Type === access.Type;
    });
  }

  _removeFromAccessIDs(accessId, accessIDs) {
    _.remove(accessIDs, function(n) {
      return n === accessId;
    });
  }

  authorizeAccess() {
    // TODO: review
    var accessData = this._processAuthorizedIDs(null, this.authorizedAccesses);
    var authorizedUserIDs = accessData.userIDs;
    var authorizedTeamIDs = accessData.teamIDs;
    var accessRole = this.formValues.selectedRole;

    for (const access of this.formValues.multiselectOutput) {
      if (this.rbacEnabled) {
        access.Role = this.formValues.selectedRole.Name;
      }
      if (access.Type === "user") {
        authorizedUserIDs.push(access.Id);
      } else if (access.Type === "team") {
        authorizedTeamIDs.push(access.Id);
      }
    }

    var accesses = {
      userAccesses: authorizedUserIDs,
      teamAccesses: authorizedTeamIDs,
    };

    if (accessRole) {
      accesses.role = accessRole.Id
    }

    this.updateAccess(accesses);
  }

  unauthorizeAccess(selectedAccesses) {
    var accessData = this._processAuthorizedIDs(null, this.authorizedAccesses);
    var authorizedUserIDs = accessData.userIDs;
    var authorizedTeamIDs = accessData.teamIDs;

    for (const access of selectedAccesses) {
      if (access.Type === "user") {
        this._removeFromAccessIDs(access.Id, authorizedUserIDs);
      } else if (access.Type === "team") {
        this._removeFromAccessIDs(access.Id, authorizedTeamIDs);
      }
    }
    this.updateAccess({
      userAccesses: authorizedUserIDs,
      teamAccesses: authorizedTeamIDs
    });
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
        entity.UserAccessPolicies,
        entity.TeamAccessPolicies,
        parent ? parent.AuthorizedUsers : [],
        parent ? parent.AuthorizedTeams : [],
        this.roles
      );
      this.accesses = data.accesses;
      this.authorizedAccesses = data.authorizedAccesses;
    } catch (err) {
      this.accesses = [];
      this.authorizedAccesses = [];
      this.Notifications.error("Failure", err, "Unable to retrieve accesses");
    }
  }
}

export default PorAccessManagementController;
angular
  .module("portainer.app")
  .controller("porAccessManagementController", PorAccessManagementController);
