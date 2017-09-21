angular.module('extension.storidge', [])
.config(['$stateRegistry', function ($stateRegistry) {
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
    name: 'cluster',
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
    name: 'monitor',
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

  $stateRegistry.register(storidge);
  $stateRegistry.register(profiles);
  $stateRegistry.register(profileCreation);
  $stateRegistry.register(profileEdition);
  $stateRegistry.register(cluster);
  $stateRegistry.register(monitor);
}]);
