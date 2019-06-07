// TODO: legacy extension management

angular.module('portainer.integrations.storidge', [])
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
        templateUrl: './views/profiles/profiles.html',
        controller: 'StoridgeProfilesController'
      }
    }
  };

  var profile = {
    name: 'storidge.profiles.profile',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: './views/profiles/edit/profile.html',
        controller: 'StoridgeProfileController'
      }
    }
  };

  var drives = {
    name: 'storidge.drives',
    url: '/drives',
    views: {
      'content@': {
        templateUrl: './views/drives/drives.html',
        controller: 'StoridgeDrivesController'
      }
    }
  };

  var drive = {
    name: 'storidge.drives.drive',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: './views/drives/inspect/drive.html',
        controller: 'StoridgeDriveController'
      }
    }
  };

  var snapshot = {
    name: 'docker.volumes.volume.snapshot',
    url: '/:snapshotId',
    views: {
      'content@': {
        templateUrl: './views/snapshots/inspect/snapshot.html',
        controller: 'StoridgeSnapshotController'
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
        templateUrl: './views/profiles/create/createprofile.html',
        controller: 'StoridgeCreateProfileController'
      }
    }
  };

  var cluster = {
    name: 'storidge.cluster',
    url: '/cluster',
    views: {
      'content@': {
        templateUrl: './views/cluster/cluster.html',
        controller: 'StoridgeClusterController'
      }
    }
  };

  var node = {
    name: 'storidge.cluster.node',
    url: '/:name',
    views: {
      'content@': {
        templateUrl: './views/nodes/inspect/node.html',
        controller: 'StoridgeNodeController'
      }
    }
  };

  var monitor = {
    name: 'storidge.monitor',
    url: '/events',
    views: {
      'content@': {
        templateUrl: './views/monitor/monitor.html',
        controller: 'StoridgeMonitorController'
      }
    }
  };

  $stateRegistryProvider.register(storidge);
  $stateRegistryProvider.register(drives);
  $stateRegistryProvider.register(drive);
  $stateRegistryProvider.register(snapshot);
  $stateRegistryProvider.register(profiles);
  $stateRegistryProvider.register(profile);
  $stateRegistryProvider.register(profileCreation);
  $stateRegistryProvider.register(cluster);
  $stateRegistryProvider.register(node);
  $stateRegistryProvider.register(monitor);
}]);
