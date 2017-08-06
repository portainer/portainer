angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ContainerHelper', 'ContainerService', 'ImageHelper', 'Network', 'Notifications', 'Pagination', 'ModalService', 'ResourceControlService', 'RegistryService', 'ImageService',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ContainerHelper, ContainerService, ImageHelper, Network, Notifications, Pagination, ModalService, ResourceControlService, RegistryService, ImageService) {
  $scope.activityTime = 0;
  $scope.portBindings = [];
  $scope.config = {
    Image: '',
    Registry: ''
  };
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('container_networks');

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('container_networks', $scope.state.pagination_count);
  };

  var update = function () {
    $('#loadingViewSpinner').show();
    Container.get({id: $stateParams.id}, function (d) {
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
      $('#loadingViewSpinner').hide();
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Unable to retrieve container info');
    });
  };

  $scope.start = function () {
    $('#loadingViewSpinner').show();
    Container.start({id: $scope.container.Id}, {}, function (d) {
      update();
      Notifications.success('Container started', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to start container');
    });
  };

  $scope.stop = function () {
    $('#loadingViewSpinner').show();
    Container.stop({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Container stopped', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to stop container');
    });
  };

  $scope.kill = function () {
    $('#loadingViewSpinner').show();
    Container.kill({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Container killed', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to kill container');
    });
  };

  $scope.commit = function () {
    $('#createImageSpinner').show();
    var image = $scope.config.Image;
    var registry = $scope.config.Registry;
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry.URL);
    ContainerCommit.commit({id: $stateParams.id, tag: imageConfig.tag, repo: imageConfig.repo}, function (d) {
      $('#createImageSpinner').hide();
      update();
      Notifications.success('Container commited', $stateParams.id);
    }, function (e) {
      $('#createImageSpinner').hide();
      update();
      Notifications.error('Failure', e, 'Unable to commit container');
    });
  };

  $scope.pause = function () {
    $('#loadingViewSpinner').show();
    Container.pause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Container paused', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to pause container');
    });
  };

  $scope.unpause = function () {
    $('#loadingViewSpinner').show();
    Container.unpause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Container unpaused', $stateParams.id);
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
    $('#loadingViewSpinner').show();
    ContainerService.remove($scope.container, cleanAssociatedVolumes)
    .then(function success() {
      Notifications.success('Container successfully removed');
      $state.go('containers', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove container');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.restart = function () {
    $('#loadingViewSpinner').show();
    Container.restart({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Container restarted', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to restart container');
    });
  };

  $scope.renameContainer = function () {
    var container = $scope.container;
    Container.rename({id: $stateParams.id, 'name': container.newContainerName}, function (d) {
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
    $('#loadingViewSpinner').show();
    Network.disconnect({id: networkId}, { Container: $stateParams.id, Force: false }, function (d) {
      if (container.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Unable to disconnect container from network');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Container left network', $stateParams.id);
        $state.go('container', {id: $stateParams.id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Unable to disconnect container from network');
    });
  };

  $scope.recreate = function() {
    var config = ContainerHelper.configFromContainer($scope.container);
    ModalService.confirmExperimentalFeature(function (experimental) {
      if(!experimental) { return; }
      ModalService.confirm({
        title: 'Are you sure ?',
        message: 'You\'re about to re-create this container, any non-persisted data will be lost. This container will be removed and another one will be created using the same configuration.',
        buttons: {
          confirm: {
            label: 'Recreate',
            className: 'btn-danger'
          }
        },
        callback: function onConfirm(confirmed) {
          if(!confirmed) { return; }
          else {
            $('#loadingViewSpinner').show();
            var container = $scope.container;
            ContainerService.remove(container, true)
            .then(function success() {
              return RegistryService.retrieveRegistryFromRepository(container.Config.Image);
            })
            .then(function success(data) {
              return ImageService.pullImage(container.Config.Image, data, true);
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
              $state.go('containers', {}, {reload: true});
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to re-create container');
            })
            .finally(function final() {
              $('#loadingViewSpinner').hide();
            });
          }
        }
      });
    });
  };

  $scope.containerJoinNetwork = function containerJoinNetwork(container, networkId) {
    $('#joinNetworkSpinner').show();
    Network.connect({id: networkId}, { Container: $stateParams.id }, function (d) {
      if (container.message) {
        $('#joinNetworkSpinner').hide();
        Notifications.error('Error', d, 'Unable to connect container to network');
      } else {
        $('#joinNetworkSpinner').hide();
        Notifications.success('Container joined network', $stateParams.id);
        $state.go('container', {id: $stateParams.id}, {reload: true});
      }
    }, function (e) {
      $('#joinNetworkSpinner').hide();
      Notifications.error('Failure', e, 'Unable to connect container to network');
    });
  };

  Network.query({}, function (d) {
      var networks = d;
      if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM' || $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
        networks = d.filter(function (network) {
          if (network.Scope === 'global') {
            return network;
          }
        });
        networks.push({Name: 'bridge'});
        networks.push({Name: 'host'});
        networks.push({Name: 'none'});
      }
      $scope.availableNetworks = networks;
      if (!_.find(networks, {'Name': 'bridge'})) {
        networks.push({Name: 'nat'});
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve networks');
    });

  update();
}]);
