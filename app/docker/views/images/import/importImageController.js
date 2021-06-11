angular.module('portainer.docker').controller('ImportImageController', [
  '$scope',
  '$state',
  'ImageService',
  'Notifications',
  'HttpRequestHelper',
  function ($scope, $state, ImageService, Notifications, HttpRequestHelper) {
    $scope.state = {
      actionInProgress: false,
    };

    $scope.formValues = {
      UploadFile: null,
      NodeName: null,
    };

    $scope.uploadImage = function () {
      $scope.state.actionInProgress = true;

      var nodeName = $scope.formValues.NodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      var file = $scope.formValues.UploadFile;
      ImageService.uploadImage(file)
        .then(function success() {
          Notifications.success('Images successfully uploaded');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to upload image');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };
  },
]);
