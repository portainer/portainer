angular.module('portainer.docker')
.controller('ContainerController', ['$q', '$scope', '$state','$transition$', '$filter', 'Container', 'ContainerCommit', 'ContainerHelper', 'ContainerService', 'ImageHelper', 'Network', 'NetworkService', 'Notifications', 'ModalService', 'ResourceControlService', 'RegistryService', 'ImageService',
function ($q, $scope, $state, $transition$, $filter, Container, ContainerCommit, ContainerHelper, ContainerService, ImageHelper, Network, NetworkService, Notifications, ModalService, ResourceControlService, RegistryService, ImageService) {
  $scope.activityTime = 0;
  $scope.portBindings = [];

  $scope.config = {
    Image: '',
    Registry: ''
  };

  $scope.state = {
    recreateContainerInProgress: false,
    joinNetworkInProgress: false,
    leaveNetworkInProgress: false
  };

  var update = function () {
    Container.get({id: $transition$.params().id}, function (d) {
      var container = new ContainerDetailsViewModel(d);
      $scope.container = container;
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(container.Name);

      if (container.State.Running) {
        $scope.activityTime = moment.duration(moment(container.State.StartedAt).utc().diff(moment().utc())).humanize();
      } else if (container.State.Status === 'created') {
        $scope.activityTime = moment.duration(moment(container.Created).utc().diff(moment().utc())).humanize();
      } else {
        $scope.activityTime = moment.duration(moment().utc().diff(moment(container.State.FinishedAt).utc())).humanize();
      }

      $scope.portBindings = [];
      if (container.NetworkSettings.Ports) {
        angular.forEach(Object.keys(container.NetworkSettings.Ports), function(portMapping) {
          if (container.NetworkSettings.Ports[portMapping]) {
            var mapping = {};
            mapping.container = portMapping;
            mapping.host = container.NetworkSettings.Ports[portMapping][0].HostIp + ':' + container.NetworkSettings.Ports[portMapping][0].HostPort;
            $scope.portBindings.push(mapping);
          }
        });
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve container info');
    });
  };

  $scope.start = function () {
    Container.start({id: $scope.container.Id}, {}, function (d) {
      update();
      Notifications.success('Container started', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to start container');
    });
  };

  $scope.stop = function () {
    Container.stop({id: $transition$.params().id}, function (d) {
      update();
      Notifications.success('Container stopped', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to stop container');
    });
  };

  $scope.kill = function () {
    Container.kill({id: $transition$.params().id}, function (d) {
      update();
      Notifications.success('Container killed', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to kill container');
    });
  };

  $scope.commit = function () {
    var image = $scope.config.Image;
    var registry = $scope.config.Registry;
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry.URL);
    ContainerCommit.commit({id: $transition$.params().id, tag: imageConfig.tag, repo: imageConfig.repo}, function (d) {
      update();
      Notifications.success('Container commited', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to commit container');
    });
  };

  $scope.pause = function () {
    Container.pause({id: $transition$.params().id}, function (d) {
      update();
      Notifications.success('Container paused', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to pause container');
    });
  };

  $scope.unpause = function () {
    Container.unpause({id: $transition$.params().id}, function (d) {
      update();
      Notifications.success('Container unpaused', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to unpause container');
    });
  };

  $scope.confirmRemove = function () {
    var title = 'You are about to remove a container.';
    if ($scope.container.State.Running) {
      title = 'You are about to remove a running container.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        var cleanAssociatedVolumes = false;
        if (result[0]) {
          cleanAssociatedVolumes = true;
        }
        $scope.remove(cleanAssociatedVolumes);
      }
    );
  };

  $scope.remove = function(cleanAssociatedVolumes) {
    ContainerService.remove($scope.container, cleanAssociatedVolumes)
    .then(function success() {
      Notifications.success('Container successfully removed');
      $state.go('docker.containers', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove container');
    });
  };

  $scope.restart = function () {
    Container.restart({id: $transition$.params().id}, function (d) {
      update();
      Notifications.success('Container restarted', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to restart container');
    });
  };

  $scope.renameContainer = function () {
    var container = $scope.container;
    Container.rename({id: $transition$.params().id, 'name': container.newContainerName}, function (d) {
      if (d.message) {
        container.newContainerName = container.Name;
        Notifications.error('Unable to rename container', {}, d.message);
      } else {
        container.Name = container.newContainerName;
        Notifications.success('Container successfully renamed', container.Name);
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to rename container');
    });
    $scope.container.edit = false;
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(container, networkId) {
    $scope.state.leaveNetworkInProgress = true;
    Network.disconnect({id: networkId}, { Container: $transition$.params().id, Force: false }, function (d) {
      if (container.message) {
        Notifications.error('Error', d, 'Unable to disconnect container from network');
      } else {
        Notifications.success('Container left network', $transition$.params().id);
        $state.go('docker.containers.container', {id: $transition$.params().id}, {reload: true});
      }
      $scope.state.leaveNetworkInProgress = false;
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to disconnect container from network');
      $scope.state.leaveNetworkInProgress = false;
    });
  };

  $scope.duplicate = function() {
    $state.go('docker.containers.new', {from: $transition$.params().id}, {reload: true});
  };

  $scope.confirmRemove = function () {
    var title = 'You are about to remove a container.';
    if ($scope.container.State.Running) {
      title = 'You are about to remove a running container.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        var cleanAssociatedVolumes = false;
        if (result[0]) {
          cleanAssociatedVolumes = true;
        }
        $scope.remove(cleanAssociatedVolumes);
      }
    );
  };

  function recreateContainer(pullImage) {
    var container = $scope.container;
    var config = ContainerHelper.configFromContainer(container.Model);
    $scope.state.recreateContainerInProgress = true;
    ContainerService.remove(container, true)
    .then(function success() {
      return RegistryService.retrieveRegistryFromRepository(container.Config.Image);
    })
    .then(function success(data) {
      return $q.when(!pullImage || ImageService.pullImage(container.Config.Image, data, true));
    })
    .then(function success() {
      return ContainerService.createAndStartContainer(config);
    })
    .then(function success(data) {
      if (!container.ResourceControl) {
        return true;
      } else {
        var containerIdentifier = data.Id;
        var resourceControl = container.ResourceControl;
        var users = resourceControl.UserAccesses.map(function(u) {
          return u.UserId;
        });
        var teams = resourceControl.TeamAccesses.map(function(t) {
          return t.TeamId;
        });
        return ResourceControlService.createResourceControl(resourceControl.AdministratorsOnly,
          users, teams, containerIdentifier, 'container', []);
      }
    })
    .then(function success(data) {
      Notifications.success('Container successfully re-created');
      $state.go('docker.containers', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to re-create container');
      $scope.state.recreateContainerInProgress = false;
    });
  }

  $scope.recreate = function() {
    ModalService.confirmContainerRecreation(function (result) {
      if(!result) { return; }
      var pullImage = false;
      if (result[0]) {
        pullImage = true;
      }
      recreateContainer(pullImage);
    });
  };

  $scope.containerJoinNetwork = function containerJoinNetwork(container, networkId) {
    $scope.state.joinNetworkInProgress = true;
    Network.connect({id: networkId}, { Container: $transition$.params().id }, function (d) {
      if (container.message) {
        Notifications.error('Error', d, 'Unable to connect container to network');
      } else {
        Notifications.success('Container joined network', $transition$.params().id);
        $state.go('docker.containers.container', {id: $transition$.params().id}, {reload: true});
      }
      $scope.state.joinNetworkInProgress = false;
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to connect container to network');
      $scope.state.joinNetworkInProgress = false;
    });
  };

  var provider = $scope.applicationState.endpoint.mode.provider;
  var apiVersion = $scope.applicationState.endpoint.apiVersion;
  NetworkService.networks(
    provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
    false,
    provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25,
    provider === 'DOCKER_SWARM'
  )
  .then(function success(data) {
    var networks = data;
    $scope.availableNetworks = networks;
  })
  .catch(function error(err) {
    Notifications.error('Failure', err, 'Unable to retrieve networks');
  });

  update();
}]);
