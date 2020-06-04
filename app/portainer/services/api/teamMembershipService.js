import { TeamMembershipModel } from '../../models/teamMembership';

angular.module('portainer.app').factory('TeamMembershipService', [
  '$q',
  'TeamMemberships',
  function TeamMembershipFactory($q, TeamMemberships) {
    'use strict';
    var service = {};

    service.memberships = function () {
      var deferred = $q.defer();
      TeamMemberships.query()
        .$promise.then(function success(data) {
          var memberships = data.map(function (item) {
            return new TeamMembershipModel(item);
          });
          deferred.resolve(memberships);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve team memberships', err: err });
        });
      return deferred.promise;
    };

    service.createMembership = function (userId, teamId, role) {
      var payload = {
        UserID: userId,
        TeamID: teamId,
        Role: role,
      };
      return TeamMemberships.create({}, payload).$promise;
    };

    service.deleteMembership = function (id) {
      return TeamMemberships.remove({ id: id }).$promise;
    };

    service.updateMembership = function (id, userId, teamId, role) {
      var payload = {
        UserID: userId,
        TeamID: teamId,
        Role: role,
      };
      return TeamMemberships.update({ id: id }, payload).$promise;
    };

    return service;
  },
]);
