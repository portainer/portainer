import { TeamViewModel } from '../../models/team';
import { TeamMembershipModel } from '../../models/teamMembership';

import i18n from '@/i18n';

angular.module('portainer.app').factory('TeamService', [
  '$q',
  'Teams',
  function TeamServiceFactory($q, Teams) {
    'use strict';
    var service = {};

    service.teams = function (environmentId) {
      var deferred = $q.defer();
      Teams.query({ environmentId: environmentId })
        .$promise.then(function success(data) {
          var teams = data.map(function (item) {
            return new TeamViewModel(item);
          });
          deferred.resolve(teams);
        })
        .catch(function error(err) {
          deferred.reject({ msg: i18n.t('portainer_users.unable_retrieve_teams'), err: err });
        });
      return deferred.promise;
    };

    service.team = function (id) {
      var deferred = $q.defer();
      Teams.get({ id: id })
        .$promise.then(function success(data) {
          var team = new TeamViewModel(data);
          deferred.resolve(team);
        })
        .catch(function error(err) {
          deferred.reject({ msg: i18n.t('portainer_users.unable_retrieve_team_details'), err: err });
        });
      return deferred.promise;
    };

    service.createTeam = function (name, leaderIds) {
      var deferred = $q.defer();
      var payload = {
        Name: name,
        TeamLeaders: leaderIds,
      };
      Teams.create({}, payload)
        .$promise.then(function success() {
          deferred.resolve();
        })
        .catch(function error(err) {
          deferred.reject({ msg: i18n.t('portainer_users.unable_create_team'), err: err });
        });
      return deferred.promise;
    };

    service.deleteTeam = function (id) {
      return Teams.remove({ id: id }).$promise;
    };

    service.userMemberships = function (id) {
      var deferred = $q.defer();
      Teams.queryMemberships({ id: id })
        .$promise.then(function success(data) {
          var memberships = data.map(function (item) {
            return new TeamMembershipModel(item);
          });
          deferred.resolve(memberships);
        })
        .catch(function error(err) {
          deferred.reject({ msg: i18n.t('portainer_users.unable_retrieve_memberships'), err: err });
        });
      return deferred.promise;
    };

    return service;
  },
]);
