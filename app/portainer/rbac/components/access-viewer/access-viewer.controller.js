import _ from 'lodash-es';

import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

export default class AccessViewerController {
  /* @ngInject */
  constructor($scope, Notifications, UserService, TeamMembershipService, Authentication) {
    this.$scope = $scope;
    this.Notifications = Notifications;
    this.UserService = UserService;
    this.TeamMembershipService = TeamMembershipService;
    this.Authentication = Authentication;

    this.limitedFeature = 'rbac-roles';
    this.users = [];
    this.selectedUserId = null;

    this.onUserSelect = this.onUserSelect.bind(this);
  }

  onUserSelect(selectedUserId) {
    this.$scope.$evalAsync(() => {
      this.selectedUserId = selectedUserId;
    });
  }

  // for admin, returns all users
  // for team leader, only return all his/her team member users
  async teamMemberUsers(users, teamMemberships) {
    if (this.isAdmin) {
      return users;
    }

    const filteredUsers = [];
    const userId = this.Authentication.getUserDetails().ID;
    const leadingTeams = await this.UserService.userLeadingTeams(userId);

    const isMember = (userId, teamId) => {
      return !!_.find(teamMemberships, { UserId: userId, TeamId: teamId });
    };

    for (const user of users) {
      for (const leadingTeam of leadingTeams) {
        if (isMember(user.Id, leadingTeam.Id)) {
          filteredUsers.push(user);
          break;
        }
      }
    }

    return filteredUsers;
  }

  async $onInit() {
    try {
      if (isLimitedToBE(this.limitedFeature)) {
        return;
      }

      this.isAdmin = this.Authentication.isAdmin();
      const allUsers = await this.UserService.users();
      const teamMemberships = await this.TeamMembershipService.memberships();
      const teamUsers = await this.teamMemberUsers(allUsers, teamMemberships);
      this.users = teamUsers.map((user) => ({ label: user.Username, value: user.Id }));
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve users');
    }
  }
}
