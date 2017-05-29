angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ContainerService', 'ImageHelper', 'Network', 'Notifications', 'Pagination', 'ModalService', 'ControllerDataPipeline',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ContainerService, ImageHelper, Network, Notifications, Pagination, ModalService, ControllerDataPipeline) {
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
      ControllerDataPipeline.setAccessControlData('container', $stateParams.id, container.ResourceControl);
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
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry);
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
    Container.rename({id: $stateParams.id, 'name': $scope.container.newContainerName}, function (d) {
      if (container.message) {
        $scope.container.newContainerName = $scope.container.Name;
        Notifications.error('Unable to rename container', {}, container.message);
      } else {
        $scope.container.Name = $scope.container.newContainerName;
        Notifications.success('Container successfully renamed', container.name);
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
    var config = $scope.container.Config;
    // HostConfig
    config.HostConfig = $scope.container.HostConfig;
    // Name
    config.name = $scope.container.Name.replace(/^\//g, '');
    // Network
    var mode = config.HostConfig.NetworkMode;
    // TODO get ip addrs
    config.NetworkingConfig = {
      "EndpointsConfig": {}
    };
    config.NetworkingConfig.EndpointsConfig = $scope.container.NetworkSettings.Networks;
    if (mode.indexOf('container:') !== -1) {
      delete config.Hostname;
      delete config.ExposedPorts;
    }
    // Set volumes
    var binds = [];
    var volumes = {};
    for (var v in $scope.container.Mounts) {
      console.log($scope.container.Mounts[v]);
      var mount = $scope.container.Mounts[v];
      var volume = {
        "type": mount.Type,
        "name": mount.Name || mount.Source,
        "containerPath": mount.Destination,
        "readOnly": mount.RW === false
      };

      var name = mount.Name || mount.Source;
      var containerPath = mount.Destination;
      if (name && containerPath) {
        var bind = name + ':' + containerPath;
        volumes[containerPath] = {};
        if (mount.RW === false) {
          bind += ':ro';
        }
        binds.push(bind);
      }
    }
    config.HostConfig.Binds = binds;
    config.Volumes = volumes;

    Container.remove({id: $scope.container.Id, v: 0, force: true}, function(d) {
      if (d.message) {
        Notifications.error("Error", d, "Unable to remove container");
      } else {
        var c = $scope.container;
        if (c.Metadata && c.Metadata.ResourceControl) {
          ResourceControlService.removeContainerResourceControl(c.Metadata.ResourceControl.OwnerId, $scope.container.Id)
          .then(function success() {
            Notifications.success("Container Removed", $scope.container.Id);
            createContainer(config);
          })
          .catch(function error(err) {
            Notifications.error("Failure", err, "Unable to remove container ownership");
          });
        } else {
          Notifications.success("Container Removed", $scope.container.Id);
          createContainer(config);
        }
      }
    });
  };

  function createContainer(config) {
    Container.create(config, function (d) {
      if (d.message) {
        Notifications.error('Error', {}, d.message);
      } else {
        /*if ($scope.formValues.Ownership === 'private') {
          ResourceControlService.setContainerResourceControl(Authentication.getUserDetails().ID, d.Id)
          .then(function success() {
            startContainer(d.Id);
          })
          .catch(function error(err) {
            $('#createContainerSpinner').hide();
            Notifications.error("Failure", err, 'Unable to apply resource control on container');
          });
        } else {*/
        Container.start({id: d.Id}, {}, function (cd) {
          if (cd.message) {
            Notifications.error('Error', {}, cd.message);
          } else {
            Notifications.success('Container Started', d.Id);
            $state.go('containers', {}, {reload: true});
          }
        }, function (e) {
          Notifications.error("Failure", e, 'Unable to start container');
        });
        //}
      }
    }, function (e) {
      Notifications.error("Failure", e, 'Unable to create container');
    });
  }

  update();
}]);
