angular.module('portainer.app')
.controller('GroupsController', ['$scope', '$state', '$filter',  'GroupService', 'Notifications',
function ($scope, $state, $filter, GroupService, Notifications) {

  // $scope.removeAction = function (selectedItems) {
  //   var actionCount = selectedItems.length;
  //   angular.forEach(selectedItems, function (endpoint) {
  //     EndpointService.deleteEndpoint(endpoint.Id)
  //     .then(function success() {
  //       Notifications.success('Endpoint successfully removed', endpoint.Name);
  //       var index = $scope.endpoints.indexOf(endpoint);
  //       $scope.endpoints.splice(index, 1);
  //     })
  //     .catch(function error(err) {
  //       Notifications.error('Failure', err, 'Unable to remove endpoint');
  //     })
  //     .finally(function final() {
  //       --actionCount;
  //       if (actionCount === 0) {
  //         $state.reload();
  //       }
  //     });
  //   });
  // };

  function initView() {
    GroupService.groups()
    .then(function success(data) {
      $scope.groups = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint groups');
      $scope.groups = [];
    });
  }

  initView();
}]);
