import _ from 'lodash-es';
import { UserViewModel } from '@/portainer/models/user';
import { getUsers } from '@/portainer/users/user.service';
import { getUser } from '@/portainer/users/queries/useUser';

import { TeamMembershipModel } from '../../models/teamMembership';

/* @ngInject */
export function UserService($q, Users, TeamService) {
  'use strict';
  var service = {};

  service.users = async function (includeAdministrators, environmentId) {
    const users = await getUsers(includeAdministrators, environmentId);

    return users.map((u) => new UserViewModel(u));
  };

  service.user = async function (userId) {
    const user = await getUser(userId);

    return new UserViewModel(user);
  };

  service.deleteUser = function (id) {
    return Users.remove({ id: id }).$promise;
  };

  service.updateUser = function (id, { newPassword, role, username }) {
    return Users.update({ id }, { newPassword, role, username }).$promise;
  };

  service.updateUserPassword = function (id, currentPassword, newPassword) {
    var payload = {
      Password: currentPassword,
      NewPassword: newPassword,
    };

    return Users.updatePassword({ id: id }, payload).$promise;
  };

  service.updateUserTheme = function (id, theme) {
    return Users.updateTheme({ id }, { theme }).$promise;
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
