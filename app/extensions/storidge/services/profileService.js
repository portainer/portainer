angular.module('extension.storidge')
.factory('StoridgeProfileService', ['$q', 'StoridgeProfiles', function StoridgeProfileServiceFactory($q, StoridgeProfiles) {
  'use strict';
  var service = {};

  service.profile = function(profileName) {
    // var profile = {
    //   Id: profileId,
    //   Name: 'profileA'
    // };
    //
    // return $q.when(profile);
    return StoridgeProfiles.get({name: profileName}).$promise;
  };

  service.profiles = function() {
    // var profiles = [
    //   {
    //     Id: 1,
    //     Name: 'profileA'
    //   },
    //   {
    //     Id: 2,
    //     Name: 'profileB'
    //   }
    // ];
    //
    // return $q.when(profiles);

    return StoridgeProfiles.query().$promise;

  };

  return service;
}]);
