angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ImageHelper', 'Network', 'Notifications', 'Pagination',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ImageHelper, Network, Notifications, Pagination) {
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

  $scope.remove = function () {
    $('#loadingViewSpinner').show();
    Container.remove({id: $stateParams.id}, function (d) {
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

  update();
}]);
