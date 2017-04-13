angular.module('portainer.services')
.factory('UserGroupService', ['$q', 'UserGroups', function UserGroupServiceFactory($q, UserGroups) {
  'use strict';
  var service = {};

  service.userGroups = function() {
    var deferred = $q.defer();
    var data = [{Id: 1, Name: "groupA"}, {Id: 2, Name: "groupB"}];
    var usergroups = data.map(function (item) {
      return new UserGroupViewModel(item);
    });
    deferred.resolve(usergroups);
    return deferred.promise;
  };

  service.userGroup = function(id) {
    var deferred = $q.defer();
    var data = {Id: 1, Name: "groupA"};
    var usergroup = new UserGroupViewModel(data);
    deferred.resolve(usergroup);
    return deferred.promise;
  };

  return service;
}]);
