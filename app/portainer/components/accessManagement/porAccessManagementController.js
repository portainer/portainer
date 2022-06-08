import _ from 'lodash-es';
import angular from 'angular';

import { RoleTypes } from '@/portainer/rbac/models/role';
import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

class PorAccessManagementController {
  /* @ngInject */
  constructor(Notifications, AccessService, RoleService) {
    Object.assign(this, { Notifications, AccessService, RoleService });

    this.limitedToBE = false;

    this.unauthorizeAccess = this.unauthorizeAccess.bind(this);
    this.updateAction = this.updateAction.bind(this);
  }

  updateAction() {
    const entity = this.accessControlledEntity;
    const oldUserAccessPolicies = entity.UserAccessPolicies;
    const oldTeamAccessPolicies = entity.TeamAccessPolicies;
    const updatedUserAccesses = _.filter(this.authorizedUsersAndTeams, { Updated: true, Type: 'user', Inherited: false });
    const updatedTeamAccesses = _.filter(this.authorizedUsersAndTeams, { Updated: true, Type: 'team', Inherited: false });

    const accessPolicies = this.AccessService.generateAccessPolicies(oldUserAccessPolicies, oldTeamAccessPolicies, updatedUserAccesses, updatedTeamAccesses);
    this.accessControlledEntity.UserAccessPolicies = accessPolicies.userAccessPolicies;
    this.accessControlledEntity.TeamAccessPolicies = accessPolicies.teamAccessPolicies;
    this.updateAccess();
  }

  authorizeAccess() {
    const entity = this.accessControlledEntity;
    const oldUserAccessPolicies = entity.UserAccessPolicies;
    const oldTeamAccessPolicies = entity.TeamAccessPolicies;
    const selectedRoleId = this.formValues.selectedRole.Id;
    const selectedUserAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === 'user');
    const selectedTeamAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === 'team');

    const accessPolicies = this.AccessService.generateAccessPolicies(oldUserAccessPolicies, oldTeamAccessPolicies, selectedUserAccesses, selectedTeamAccesses, selectedRoleId);
    this.accessControlledEntity.UserAccessPolicies = accessPolicies.userAccessPolicies;
    this.accessControlledEntity.TeamAccessPolicies = accessPolicies.teamAccessPolicies;
    this.updateAccess();
  }

  unauthorizeAccess(selectedAccesses) {
    const entity = this.accessControlledEntity;
    const userAccessPolicies = entity.UserAccessPolicies;
    const teamAccessPolicies = entity.TeamAccessPolicies;
    const selectedUserAccesses = _.filter(selectedAccesses, (access) => access.Type === 'user');
    const selectedTeamAccesses = _.filter(selectedAccesses, (access) => access.Type === 'team');

    _.forEach(selectedUserAccesses, (access) => delete userAccessPolicies[access.Id]);
    _.forEach(selectedTeamAccesses, (access) => delete teamAccessPolicies[access.Id]);
    this.updateAccess();
  }

  isRoleLimitedToBE(role) {
    if (!this.limitedToBE) {
      return false;
    }

    return role.ID !== RoleTypes.STANDARD;
  }

  roleLabel(role) {
    if (!this.limitedToBE) {
      return role.Name;
    }

    if (this.isRoleLimitedToBE(role)) {
      return `${role.Name} (Business Edition Feature)`;
    }

    return `${role.Name} (Default)`;
  }

  async $onInit() {
    try {
      if (this.limitedFeature) {
        this.limitedToBE = isLimitedToBE(this.limitedFeature);
      }

      const entity = this.accessControlledEntity;
      const parent = this.inheritFrom;

      const roles = await this.RoleService.roles();
      this.roles = _.orderBy(roles, 'Priority', 'asc');
      this.formValues = {
        selectedRole: this.roles.find((role) => !this.isRoleLimitedToBE(role)),
      };

      const data = await this.AccessService.accesses(entity, parent, this.roles);

      if (this.filterUsers) {
        data.availableUsersAndTeams = this.filterUsers(data.availableUsersAndTeams);
      }

      this.availableUsersAndTeams = _.orderBy(data.availableUsersAndTeams, 'Name', 'asc');
      this.authorizedUsersAndTeams = data.authorizedUsersAndTeams;
    } catch (err) {
      this.availableUsersAndTeams = [];
      this.authorizedUsersAndTeams = [];
      this.Notifications.error('Failure', err, 'Unable to retrieve accesses');
    }
  }
}

export default PorAccessManagementController;
angular.module('portainer.app').controller('porAccessManagementController', PorAccessManagementController);
