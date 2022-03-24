import _ from 'lodash-es';
import { UserTokenModel, UserViewModel } from '@/portainer/models/user';
import { getUser, getUsers } from '@/portainer/users/user.service';

import { TeamMembershipModel } from '../../models/teamMembership';

/* @ngInject */
export function UserService($q, Users, TeamService, TeamMembershipService) {
  'use strict';
  var service = {};

  service.users = async function (includeAdministrators) {
    const users = await getUsers(includeAdministrators);

    return users.map((u) => new UserViewModel(u));
  };

  service.user = async function (includeAdministrators) {
    const user = await getUser(includeAdministrators);

    return new UserViewModel(user);
  };

  service.createUser = function (username, password, role, teamIds) {
    var deferred = $q.defer();

    var payload = {
      username: username,
      password: password,
      role: role,
    };

    Users.create({}, payload)
      .$promise.then(function success(data) {
        var userId = data.Id;
        var teamMembershipQueries = [];
        angular.forEach(teamIds, function (teamId) {
          teamMembershipQueries.push(TeamMembershipService.createMembership(userId, teamId, 2));
        });
        $q.all(teamMembershipQueries).then(function success() {
          deferred.resolve();
        });
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to create user', err: err });
      });

    return deferred.promise;
  };

  service.deleteUser = function (id) {
    return Users.remove({ id: id }).$promise;
  };

  service.updateUser = function (id, { password, role, username }) {
    return Users.update({ id }, { password, role, username }).$promise;
  };

  service.updateUserPassword = function (id, currentPassword, newPassword) {
    var payload = {
      Password: currentPassword,
      NewPassword: newPassword,
    };

    return Users.updatePassword({ id: id }, payload).$promise;
  };

  service.updateUserTheme = function (id, userTheme) {
    return Users.updateTheme({ id }, { userTheme }).$promise;
  };

  service.userMemberships = function (id) {
    var deferred = $q.defer();

    Users.queryMemberships({ id: id })
      .$promise.then(function success(data) {
        var memberships = data.map(function (item) {
          return new TeamMembershipModel(item);
        });
        deferred.resolve(memberships);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve user memberships', err: err });
      });

    return deferred.promise;
  };

  service.userLeadingTeams = function (id) {
    var deferred = $q.defer();

    $q.all({
      teams: TeamService.teams(),
      memberships: service.userMemberships(id),
    })
      .then(function success(data) {
        var memberships = data.memberships;
        var teams = data.teams.filter(function (team) {
          var membership = _.find(memberships, { TeamId: team.Id });
          if (membership && membership.Role === 1) {
            return team;
          }
        });
        deferred.resolve(teams);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve user teams', err: err });
      });

    return deferred.promise;
  };

  service.createAccessToken = function (id, description) {
    const deferred = $q.defer();
    const payload = { description };
    Users.createAccessToken({ id }, payload)
      .$promise.then((data) => {
        deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to create user', err: err });
      });
    return deferred.promise;
  };

  service.getAccessTokens = function (id) {
    var deferred = $q.defer();

    Users.getAccessTokens({ id: id })
      .$promise.then(function success(data) {
        var userTokens = data.map(function (item) {
          return new UserTokenModel(item);
        });
        deferred.resolve(userTokens);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve user tokens', err: err });
      });

    return deferred.promise;
  };

  service.deleteAccessToken = function (id, tokenId) {
    return Users.deleteAccessToken({ id: id, tokenId: tokenId }).$promise;
  };

  service.initAdministrator = function (username, password) {
    return Users.initAdminUser({ Username: username, Password: password }).$promise;
  };

  service.administratorExists = function () {
    var deferred = $q.defer();

    Users.checkAdminUser({})
      .$promise.then(function success() {
        deferred.resolve(true);
      })
      .catch(function error(err) {
        if (err.status === 404) {
          deferred.resolve(false);
        }
        deferred.reject({ msg: 'Unable to verify administrator account existence', err: err });
      });

    return deferred.promise;
  };

  return service;
}
