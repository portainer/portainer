angular.module('extension.storidge')
.factory('StoridgeProfileService', ['$q', function StoridgeProfileServiceFactory($q) {
  'use strict';
  var service = {};

  service.profile = function(profileId) {
    var profile = {
      Id: profileId,
      Name: 'profileA'
    };

    return $q.when(profile);
  };

  service.profiles = function() {
    var profiles = [
      {
        Id: 1,
        Name: 'profileA'
      },
      {
        Id: 2,
        Name: 'profileB'
      }
    ];

    return $q.when(profiles);
  };

  return service;
}]);
