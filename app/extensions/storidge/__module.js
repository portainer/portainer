angular.module('extension.storidge', [])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var storidge = {
    name: 'storidge',
    parent: 'root',
    abstract: true,
    url: '/storidge'
  };

  var profiles = {
    name: 'storidge.profiles',
    url: '/profiles',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/profiles.html',
        controller: 'StoridgeProfilesController'
      }
    }
  };

  var profile = {
    name: 'storidge.profiles.profile',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/edit/profile.html',
        controller: 'StoridgeProfileController'
      }
    }
  };

  var profileCreation = {
    name: 'storidge.profiles.new',
    url: '/new',
    params: {
      profileName: ''
    },
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/create/createprofile.html',
        controller: 'StoridgeCreateProfileController'
      }
    }
  };

  var cluster = {
    name: 'storidge.cluster',
    url: '/cluster',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/cluster/cluster.html',
        controller: 'StoridgeClusterController'
      }
    }
  };

  var monitor = {
    name: 'storidge.monitor',
    url: '/events',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/monitor/monitor.html',
        controller: 'StoridgeMonitorController'
      }
    }
  };

  $stateRegistryProvider.register(storidge);
  $stateRegistryProvider.register(profiles);
  $stateRegistryProvider.register(profile);
  $stateRegistryProvider.register(profileCreation);
  $stateRegistryProvider.register(cluster);
  $stateRegistryProvider.register(monitor);
}]);
