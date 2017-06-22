angular.module('stackv2', [])
.controller('StackV2Controller', ['$scope', '$stateParams', 'StackService', 'Notifications',
function ($scope, $stateParams, StackService, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackName = $stateParams.name;

    StackService.stackV2(stackName)
    .then(function success(data) {
      $scope.stack = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
