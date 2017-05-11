angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ImageHelper', 'Network', 'Notifications', 'Pagination', 'ModalService',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ImageHelper, Network, Notifications, Pagination, ModalService) {
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
      $scope.container = d;
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(d.Name);

      if (d.State.Running) {
        $scope.activityTime = moment.duration(moment(d.State.StartedAt).utc().diff(moment().utc())).humanize();
      } else if (d.State.Status === "created") {
        $scope.activityTime = moment.duration(moment(d.Created).utc().diff(moment().utc())).humanize();
      } else {
        $scope.activityTime = moment.duration(moment().utc().diff(moment(d.State.FinishedAt).utc())).humanize();
      }

      $scope.portBindings = [];
      if (d.NetworkSettings.Ports) {
        angular.forEach(Object.keys(d.NetworkSettings.Ports), function(portMapping) {
          if (d.NetworkSettings.Ports[portMapping]) {
            var mapping = {};
            mapping.container = portMapping;
            mapping.host = d.NetworkSettings.Ports[portMapping][0].HostIp + ':' + d.NetworkSettings.Ports[portMapping][0].HostPort;
            $scope.portBindings.push(mapping);
          }
        });
      }
      $('#loadingViewSpinner').hide();
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error("Failure", e, "Unable to retrieve container info");
    });
  };

  $scope.start = function () {
    $('#loadingViewSpinner').show();
    Container.start({id: $scope.container.Id}, {}, function (d) {
      update();
      Notifications.success("Container started", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to start container");
    });
  };

  $scope.stop = function () {
    $('#loadingViewSpinner').show();
    Container.stop({id: $stateParams.id}, function (d) {
      update();
      Notifications.success("Container stopped", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to stop container");
    });
  };

  $scope.kill = function () {
    $('#loadingViewSpinner').show();
    Container.kill({id: $stateParams.id}, function (d) {
      update();
      Notifications.success("Container killed", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to kill container");
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
      Notifications.success("Container commited", $stateParams.id);
    }, function (e) {
      $('#createImageSpinner').hide();
      update();
      Notifications.error("Failure", e, "Unable to commit container");
    });
  };

  $scope.pause = function () {
    $('#loadingViewSpinner').show();
    Container.pause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success("Container paused", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to pause container");
    });
  };

  $scope.unpause = function () {
    $('#loadingViewSpinner').show();
    Container.unpause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success("Container unpaused", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to unpause container");
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
    Container.remove({id: $stateParams.id, v: (cleanAssociatedVolumes) ? 1 : 0, force: true}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error("Failure", d, "Unable to remove container");
      }
      else {
        $state.go('containers', {}, {reload: true});
        Notifications.success("Container removed", $stateParams.id);
      }
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to remove container");
    });
  };

  $scope.restart = function () {
    $('#loadingViewSpinner').show();
    Container.restart({id: $stateParams.id}, function (d) {
      update();
      Notifications.success("Container restarted", $stateParams.id);
    }, function (e) {
      update();
      Notifications.error("Failure", e, "Unable to restart container");
    });
  };

  $scope.renameContainer = function () {
    Container.rename({id: $stateParams.id, 'name': $scope.container.newContainerName}, function (d) {
      if (d.message) {
        $scope.container.newContainerName = $scope.container.Name;
        Notifications.error("Unable to rename container", {}, d.message);
      } else {
        $scope.container.Name = $scope.container.newContainerName;
        Notifications.success("Container successfully renamed", d.name);
      }
    }, function (e) {
      Notifications.error("Failure", e, 'Unable to rename container');
    });
    $scope.container.edit = false;
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(container, networkId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: networkId}, { Container: $stateParams.id, Force: false }, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error("Error", d, "Unable to disconnect container from network");
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success("Container left network", $stateParams.id);
        $state.go('container', {id: $stateParams.id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error("Failure", e, "Unable to disconnect container from network");
    });
  };

  $scope.recreate = function() {
    console.log($scope.container);
    var config = $scope.container.Config;
    config.HostConfig = $scope.container.HostConfig;
    config.name = $scope.container.Name.replace(/^\//g, '');
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
