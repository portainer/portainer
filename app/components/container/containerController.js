angular.module('container', [])
.controller('ContainerController', ['$scope', '$stateParams', '$state', '$filter', 'Container', 'ContainerCommit', 'Image', 'Messages', 'ViewSpinner', '$timeout',
function ($scope, $stateParams, $state, $filter, Container, ContainerCommit, Image, Messages, ViewSpinner, $timeout) {
  $scope.changes = [];
  $scope.editEnv = false;
  $scope.editPorts = false;
  $scope.editBinds = false;
  $scope.newCfg = {
    Env: [],
    Ports: {}
  };

  var update = function () {
    ViewSpinner.spin();
    Container.get({id: $stateParams.id}, function (d) {
      $scope.container = d;
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(d.Name);

      // fill up env
      if (d.Config.Env) {
        $scope.newCfg.Env = d.Config.Env.map(function (entry) {
          return {name: entry.split('=')[0], value: entry.split('=')[1]};
        });
      }

      // fill up ports
      $scope.newCfg.Ports = {};
      angular.forEach(d.Config.ExposedPorts, function(i, port) {
        if (d.HostConfig.PortBindings && port in d.HostConfig.PortBindings) {
          $scope.newCfg.Ports[port] = d.HostConfig.PortBindings[port];
        }
        else {
          $scope.newCfg.Ports[port] = [];
        }
      });

      // fill up bindings
      $scope.newCfg.Binds = [];
      var defaultBinds = {};
      angular.forEach(d.Config.Volumes, function(value, vol) {
        defaultBinds[vol] = { ContPath: vol, HostPath: '', ReadOnly: false, DefaultBind: true };
      });
      angular.forEach(d.HostConfig.Binds, function(binding, i) {
        var mountpoint = binding.split(':')[0];
        var vol = binding.split(':')[1] || '';
        var ro = binding.split(':').length > 2 && binding.split(':')[2] === 'ro';
        var defaultBind = false;
        if (vol === '') {
          vol = mountpoint;
          mountpoint = '';
        }

        if (vol in defaultBinds) {
          delete defaultBinds[vol];
          defaultBind = true;
        }
        $scope.newCfg.Binds.push({ ContPath: vol, HostPath: mountpoint, ReadOnly: ro, DefaultBind: defaultBind });
      });
      angular.forEach(defaultBinds, function(bind) {
        $scope.newCfg.Binds.push(bind);
      });

      ViewSpinner.stop();
    }, function (e) {
      if (e.status === 404) {
        $('.detail').hide();
        Messages.error("Not found", "Container not found.");
      } else {
        Messages.error("Failure", e.data);
      }
      ViewSpinner.stop();
    });

  };

  $scope.start = function () {
    ViewSpinner.spin();
    Container.start({
      id: $scope.container.Id,
      HostConfig: $scope.container.HostConfig
    }, function (d) {
      update();
      Messages.send("Container started", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to start." + e.data);
    });
  };

  $scope.stop = function () {
    ViewSpinner.spin();
    Container.stop({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container stopped", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to stop." + e.data);
    });
  };

  $scope.kill = function () {
    ViewSpinner.spin();
    Container.kill({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container killed", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to die." + e.data);
    });
  };

  $scope.commit = function () {
    ViewSpinner.spin();
    ContainerCommit.commit({id: $stateParams.id, repo: $scope.container.Config.Image}, function (d) {
      update();
      Messages.send("Container commited", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to commit." + e.data);
    });
  };
  $scope.pause = function () {
    ViewSpinner.spin();
    Container.pause({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container paused", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to pause." + e.data);
    });
  };

  $scope.unpause = function () {
    ViewSpinner.spin();
    Container.unpause({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container unpaused", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to unpause." + e.data);
    });
  };

  $scope.remove = function () {
    ViewSpinner.spin();
    Container.remove({id: $stateParams.id}, function (d) {
      update();
      $state.go('containers', {}, {reload: true});
      Messages.send("Container removed", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to remove." + e.data);
    });
  };

  $scope.restart = function () {
    ViewSpinner.spin();
    Container.restart({id: $stateParams.id}, function (d) {
      update();
      Messages.send("Container restarted", $stateParams.id);
    }, function (e) {
      update();
      Messages.error("Failure", "Container failed to restart." + e.data);
    });
  };

  $scope.hasContent = function (data) {
    return data !== null && data !== undefined;
  };

  $scope.getChanges = function () {
    ViewSpinner.spin();
    Container.changes({id: $stateParams.id}, function (d) {
      $scope.changes = d;
      ViewSpinner.stop();
    });
  };

  $scope.renameContainer = function () {
    // #FIXME fix me later to handle http status to show the correct error message
    Container.rename({id: $stateParams.id, 'name': $scope.container.newContainerName}, function (data) {
      if (data.name) {
        $scope.container.Name = data.name;
        Messages.send("Container renamed", $stateParams.id);
      } else {
        $scope.container.newContainerName = $scope.container.Name;
        Messages.error("Failure", "Container failed to rename.");
      }
    });
    $scope.container.edit = false;
  };

  $scope.addEntry = function (array, entry) {
    array.push(entry);
  };
  $scope.rmEntry = function (array, entry) {
    var idx = array.indexOf(entry);
    array.splice(idx, 1);
  };

  $scope.toggleEdit = function() {
    $scope.edit = !$scope.edit;
  };

  update();
  $scope.getChanges();
}]);
