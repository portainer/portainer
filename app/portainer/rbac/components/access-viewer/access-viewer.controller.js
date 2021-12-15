import _ from 'lodash-es';
import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

import AccessViewerPolicyModel from '../../models/access';

export default class AccessViewerController {
  /* @ngInject */
  constructor(Notifications, RoleService, UserService, EndpointService, GroupService, TeamService, TeamMembershipService) {
    this.Notifications = Notifications;
    this.RoleService = RoleService;
    this.UserService = UserService;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
    this.TeamService = TeamService;
    this.TeamMembershipService = TeamMembershipService;

    this.limitedFeature = 'rbac-roles';
    this.users = [];
  }

  onUserSelect() {
    this.userRoles = [];
    const userRoles = {};
    const user = this.selectedUser;
    const userMemberships = _.filter(this.teamMemberships, { UserId: user.Id });

    for (const [, endpoint] of _.entries(this.endpoints)) {
      let role = this.getRoleFromUserEndpointPolicy(user, endpoint);
      if (role) {
        userRoles[endpoint.Id] = role;
        continue;
      }

      role = this.getRoleFromUserEndpointGroupPolicy(user, endpoint);
      if (role) {
        userRoles[endpoint.Id] = role;
        continue;
      }

      role = this.getRoleFromTeamEndpointPolicies(userMemberships, endpoint);
      if (role) {
        userRoles[endpoint.Id] = role;
        continue;
      }

      role = this.getRoleFromTeamEndpointGroupPolicies(userMemberships, endpoint);
      if (role) {
        userRoles[endpoint.Id] = role;
      }
    }

    this.userRoles = _.values(userRoles);
  }

  findLowestRole(policies) {
    return _.first(_.orderBy(policies, 'RolePriority', 'desc'));
  }

  getRoleFromUserEndpointPolicy(user, endpoint) {
    const policyRoles = [];
    const policy = (endpoint.UserAccessPolicies || {})[user.Id];
    if (policy) {
      const accessPolicy = new AccessViewerPolicyModel(policy, endpoint, this.roles, null, null);
      policyRoles.push(accessPolicy);
    }
    return this.findLowestRole(policyRoles);
  }

  getRoleFromUserEndpointGroupPolicy(user, endpoint) {
    const policyRoles = [];
    const policy = this.groupUserAccessPolicies[endpoint.GroupId][user.Id];
    if (policy) {
      const accessPolicy = new AccessViewerPolicyModel(policy, endpoint, this.roles, this.groups[endpoint.GroupId], null);
      policyRoles.push(accessPolicy);
    }
    return this.findLowestRole(policyRoles);
  }

  getRoleFromTeamEndpointPolicies(memberships, endpoint) {
    const policyRoles = [];
    for (const membership of memberships) {
      const policy = (endpoint.TeamAccessPolicies || {})[membership.TeamId];
      if (policy) {
        const accessPolicy = new AccessViewerPolicyModel(policy, endpoint, this.roles, null, this.teams[membership.TeamId]);
        policyRoles.push(accessPolicy);
      }
    }
    return this.findLowestRole(policyRoles);
  }

  getRoleFromTeamEndpointGroupPolicies(memberships, endpoint) {
    const policyRoles = [];
    for (const membership of memberships) {
      const policy = this.groupTeamAccessPolicies[endpoint.GroupId][membership.TeamId];
      if (policy) {
        const accessPolicy = new AccessViewerPolicyModel(policy, endpoint, this.roles, this.groups[endpoint.GroupId], this.teams[membership.TeamId]);
        policyRoles.push(accessPolicy);
      }
    }
    return this.findLowestRole(policyRoles);
  }

  async $onInit() {
    try {
      const limitedToBE = isLimitedToBE(this.limitedFeature);

      if (limitedToBE) {
        return;
      }

      this.users = await this.UserService.users();
      this.endpoints = _.keyBy((await this.EndpointService.endpoints()).value, 'Id');
      const groups = await this.GroupService.groups();
      this.groupUserAccessPolicies = {};
      this.groupTeamAccessPolicies = {};
      _.forEach(groups, (group) => {
        this.groupUserAccessPolicies[group.Id] = group.UserAccessPolicies;
        this.groupTeamAccessPolicies[group.Id] = group.TeamAccessPolicies;
      });
      this.groups = _.keyBy(groups, 'Id');
      this.roles = _.keyBy(await this.RoleService.roles(), 'Id');
      this.teams = _.keyBy(await this.TeamService.teams(), 'Id');
      this.teamMemberships = await this.TeamMembershipService.memberships();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve accesses');
    }
  }
}
