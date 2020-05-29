import { TeamViewModel } from '../../models/team';
import { TeamMembershipModel } from '../../models/teamMembership';

angular.module('portainer.app').factory('TeamService', [
  '$q',
  'Teams',
  'TeamMembershipService',
  function TeamServiceFactory($q, Teams, TeamMembershipService) {
    'use strict';
    var service = {};

    service.teams = function () {
      var deferred = $q.defer();
      Teams.query()
        .$promise.then(function success(data) {
          var teams = data.map(function (item) {
            return new TeamViewModel(item);
          });
          deferred.resolve(teams);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve teams', err: err });
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
          deferred.reject({ msg: 'Unable to retrieve team details', err: err });
        });
      return deferred.promise;
    };

    service.createTeam = function (name, leaderIds) {
      var deferred = $q.defer();
      var payload = {
        Name: name,
      };
      Teams.create({}, payload)
        .$promise.then(function success(data) {
          var teamId = data.Id;
          var teamMembershipQueries = [];
          angular.forEach(leaderIds, function (userId) {
            teamMembershipQueries.push(TeamMembershipService.createMembership(userId, teamId, 1));
          });
          $q.all(teamMembershipQueries).then(function success() {
            deferred.resolve();
          });
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to create team', err: err });
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
          deferred.reject({ msg: 'Unable to retrieve user memberships for the team', err: err });
        });
      return deferred.promise;
    };

    return service;
  },
]);
