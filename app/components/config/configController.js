angular.module('config', [])
.controller('ConfigController', ['$scope', '$transition$', '$state',  '$document', 'ConfigService', 'Notifications', 'CodeMirrorService',
function ($scope, $transition$, $state, $document, ConfigService, Notifications, CodeMirrorService) {

  $scope.removeConfig = function removeConfig(configId) {
    $('#loadingViewSpinner').show();
    ConfigService.remove(configId)
    .then(function success(data) {
      Notifications.success('Config successfully removed');
      $state.go('configs', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove config');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initEditor() {
    $document.ready(function() {
      var webEditorElement = $document[0].getElementById('config-editor');
      if (webEditorElement) {
        $scope.editor = CodeMirrorService.applyCodeMirrorOnElement(webEditorElement, false, true);
      }
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    ConfigService.config($transition$.params().id)
    .then(function success(data) {
      $scope.config = data;
      initEditor();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve config details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
