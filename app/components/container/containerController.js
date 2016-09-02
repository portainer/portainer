angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ImageHelper', 'Messages',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ImageHelper, Messages) {
  $scope.activityTime = 0;
  $scope.portBindings = [];
  $scope.config = {
    Image: '',
    Registry: ''
  };

  var update = function () {
    $('#loadingViewSpinner').show();
    Container.get({id: $stateParams.id}, function (d) {
      $scope.container = d;
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(d.Name);

      if (d.State.Running) {
        $scope.activityTime = moment.duration(moment(d.State.StartedAt).utc().diff(moment().utc())).humanize();
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
      if (e.status === 404) {
        $('.detail').hide();
        Messages.error("Not found", "Container not found.");
      } else {
        Messages.error("Failure", e.data);
      }
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.start = function () {
    $('#loadingViewSpinner').show();
    Container.start({id: $scope.container.Id}, {}, function (d) {
      update();
      Messages.send("Container started", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to start." + e.data);
    });
  };

  $scope.stop = function () {
    $('#loadingViewSpinner').show();
    Container.stop({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container stopped", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to stop." + e.data);
    });
  };

  $scope.kill = function () {
    $('#loadingViewSpinner').show();
    Container.kill({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container killed", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to die." + e.data);
    });
  };

  $scope.commit = function () {
    $('#createImageSpinner').show();
    var image = _.toLower($scope.config.Image);
    var registry = _.toLower($scope.config.Registry);
    var imageConfig = ImageHelper.createImageConfig(image, registry);
    ContainerCommit.commit({id: $stateParams.id, tag: imageConfig.tag, repo: imageConfig.repo}, function (d) {
      update();
      $('#createImageSpinner').hide();
      Messages.send("Container commited", $stateParams.id);
    }, function (e) {
      update();
      $('#createImageSpinner').hide();
      Messages.error("Failure", "Container failed to commit." + e.data);
    });
  };

  $scope.pause = function () {
    $('#loadingViewSpinner').show();
    Container.pause({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container paused", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to pause." + e.data);
    });
  };

  $scope.unpause = function () {
    $('#loadingViewSpinner').show();
    Container.unpause({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container unpaused", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to unpause." + e.data);
    });
  };

  $scope.remove = function () {
    $('#loadingViewSpinner').show();
    Container.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", d.message);
      }
      else {
        $state.go('containers', {}, {reload: true});
        Messages.send("Container removed", $stateParams.id);
      }
    }, function (e) {
      if (e.data.message) {
        Messages.error("Failure", e.data.message);
      } else {
        Messages.error("Failure", 'Unable to remove container');
      }
      update();
    });
  };

  $scope.restart = function () {
    $('#loadingViewSpinner').show();
    Container.restart({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container restarted", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to restart." + e.data);
    });
  };

  $scope.renameContainer = function () {
    Container.rename({id: $stateParams.id, 'name': $scope.container.newContainerName}, function (d) {
      if (d.message) {
        $scope.container.newContainerName = $scope.container.Name;
        Messages.error("Unable to rename container", d.message);
      } else {
        $scope.container.Name = $scope.container.newContainerName;
        Messages.send("Container successfully renamed", d.name);
      }
    }, function (e) {
      if (e.data.message) {
        Messages.error("Failure", e.data.message);
      } else {
        Messages.error("Failure", 'Unable to rename container');
      }
    });
    $scope.container.edit = false;
  };

  update();
}]);
