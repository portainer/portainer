angular.module('extension.storidge', [])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var storidge = {
    name: 'storidge',
    abstract: true,
    url: '/storidge',
    views: {
      'content@': {
        template: '<div ui-view="content@"></div>'
      },
      'sidebar@': {
        template: '<div ui-view="sidebar@"></div>'
      }
    }
  };

  var profiles = {
    name: 'storidge.profiles',
    url: '/profiles',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/profiles.html',
        controller: 'StoridgeProfilesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  };

  var profileCreation = {
    name: 'storidge.profiles.create',
    url: '/create',
    params: {
      profileName: ''
    },
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/create/createProfile.html',
        controller: 'CreateProfileController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  };

  var profileEdition = {
    name: 'storidge.profiles.edit',
    url: '/edit/:id',
    views: {
      'content@': {
        templateUrl: 'app/extensions/storidge/views/profiles/edit/editProfile.html',
        controller: 'EditProfileController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
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
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
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
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  };

  $stateRegistryProvider.register(storidge);
  $stateRegistryProvider.register(profiles);
  $stateRegistryProvider.register(profileCreation);
  $stateRegistryProvider.register(profileEdition);
  $stateRegistryProvider.register(cluster);
  $stateRegistryProvider.register(monitor);
}]);
