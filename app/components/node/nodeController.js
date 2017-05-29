// @@OLD_SERVICE_CONTROLLER: this service should be rewritten to use services.
// See app/components/templates/templatesController.js as a reference.
angular.module('node', [])
.controller('NodeController', ['$scope', '$state', '$stateParams', 'LabelHelper', 'Node', 'NodeHelper', 'Task', 'Pagination', 'Notifications',
function ($scope, $state, $stateParams, LabelHelper, Node, NodeHelper, Task, Pagination, Notifications) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('node_tasks');
  $scope.loading = true;
  $scope.tasks = [];
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  var originalNode = {};
  var editedKeys = [];

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('node_tasks', $scope.state.pagination_count);
  };

  $scope.updateNodeAttribute = function updateNodeAttribute(node, key) {
    editedKeys.push(key);
  };
  $scope.addLabel = function addLabel(node) {
    node.Labels.push({ key: '', value: '', originalValue: '', originalKey: '' });
    $scope.updateNodeAttribute(node, 'Labels');
  };
  $scope.removeLabel = function removeLabel(node, index) {
    var removedElement = node.Labels.splice(index, 1);
    if (removedElement !== null) {
      $scope.updateNodeAttribute(node, 'Labels');
    }
  };
  $scope.updateLabel = function updateLabel(node, label) {
    if (label.value !== label.originalValue || label.key !== label.originalKey) {
      $scope.updateNodeAttribute(node, 'Labels');
    }
  };

  $scope.hasChanges = function(node, elements) {
    if (!elements) {
      elements = Object.keys(originalNode);
    }
    var hasChanges = false;
    elements.forEach(function(key) {
      hasChanges = hasChanges || ((editedKeys.indexOf(key) >= 0) && node[key] !== originalNode[key]);
    });
    return hasChanges;
  };

  $scope.cancelChanges = function(node) {
    editedKeys.forEach(function(key) {
      node[key] = originalNode[key];
    });
    editedKeys = [];
  };

  $scope.updateNode = function updateNode(node) {
    var config = NodeHelper.nodeToConfig(node.Model);
    config.Name = node.Name;
    config.Availability = node.Availability;
    config.Role = node.Role;
    config.Labels = LabelHelper.fromKeyValueToLabelHash(node.Labels);

    Node.update({ id: node.Id, version: node.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Notifications.success('Node successfully updated', 'Node updated');
      $state.go('node', {id: node.Id}, {reload: true});
    }, function (e) {
      $('#loadServicesSpinner').hide();
      Notifications.error('Failure', e, 'Failed to update node');
    });
  };

  function loadNodeAndTasks() {
    $scope.loading = true;
    if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
      Node.get({ id: $stateParams.id}, function(d) {
        if (d.message) {
          Notifications.error('Failure', e, 'Unable to inspect the node');
        } else {
          var node = new NodeViewModel(d);
          originalNode = angular.copy(node);
          $scope.node = node;
          getTasks(d);
        }
        $scope.loading = false;
      });
    } else {
      $scope.loading = false;
    }
  }

  function getTasks(node) {
    if (node) {
      Task.query({filters: {node: [node.ID]}}, function (tasks) {
        $scope.tasks = tasks.map(function (task) {
          return new TaskViewModel(task);
        });
      }, function (e) {
        Notifications.error('Failure', e, 'Unable to retrieve tasks associated to the node');
      });
    }
  }

  loadNodeAndTasks();

}]);
