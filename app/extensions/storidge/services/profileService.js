angular.module('extension.storidge')
.factory('StoridgeProfileService', ['$q', 'StoridgeProfiles', function StoridgeProfileServiceFactory($q, StoridgeProfiles) {
  'use strict';
  var service = {};

  service.profile = function(profileName) {
    var profile = {
      'name': 'AIRVIDEO',
      'capacity': 30,
      'directory': '/cio/airvideo',
      'iops': {
        'min': 1000,
        'max': 5000
      },
      'level': 2,
      'local': false,
      'provision': 'thin',
      'service': {
        'compression': false,
        'dedupe': false,
        'encryption': {
          'enabled': false
        },
        'replication': {
          'enabled': false,
          'destination': 'none',
          'interval': 120,
          'type': 'synchronous'
        },
        'snapshot': {
          'enabled': false,
          'start': 1440,
          'interval': 60,
          'max': 10
        }
      },
      'type': 'ssd'
    };

    return $q.when(profile);
    // return StoridgeProfiles.get({name: profileName}).$promise;
  };

  service.profiles = function() {
    var profiles = {
      'profiles': [
        'AIRVIDEO                                 Wed Jul 19 13:03:19 2017',
        'CASSANDRA                                Wed Jul 19 13:03:19 2017',
        'CIFS                                     Wed Jul 19 13:03:19 2017',
        'CNFS                                     Wed Jul 19 13:03:19 2017',
        'FIO                                      Wed Jul 19 13:03:19 2017',
        'HADOOP                                   Wed Jul 19 13:03:19 2017',
        'INFS                                     Wed Jul 19 13:03:19 2017',
        'ISCSI                                    Wed Jul 19 13:03:19 2017',
        'ISMB                                     Wed Jul 19 13:03:19 2017',
        'MARIA                                    Wed Jul 19 13:03:19 2017',
        'MINECRAFT                                Wed Jul 19 13:03:19 2017',
        'MONGO                                    Wed Jul 19 13:03:19 2017',
        'MYSQL                                    Wed Jul 19 13:03:19 2017',
        'NGINX                                    Wed Jul 19 13:03:19 2017',
        'OWNCLOUD                                 Wed Jul 19 13:03:19 2017',
        'POSTGRES                                 Wed Jul 19 13:03:19 2017',
        'REDIS                                    Wed Jul 19 13:03:19 2017',
        'SWIFT                                    Wed Jul 19 13:03:19 2017'
      ]
    };

    return $q.when(profiles);

    // return StoridgeProfiles.query().$promise;

  };

  return service;
}]);
