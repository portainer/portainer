angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state', '$document', 'StackService', 'Notifications',
function ($scope, $state, $document, StackService, Notifications) {

  $scope.formValues = {
    Name: '',
    StackFile: 'version: "3"\nservices:\n  myservice:\n    image: nginx\n    deploy:\n      mode: global'
  };

  $scope.deployStack = function () {
    $('#createStackSpinner').show();

    var name = $scope.formValues.Name;
    // The codemirror editor does not work with ng-model so we need to retrieve
    // the value directly from the editor.
    var stackFile = $scope.editor.getValue();

    StackService.createStack(name, stackFile)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
      $state.go('stacks');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create stack');
    })
    .finally(function final() {
      $('#createStackSpinner').hide();
    });
  };

  function initView() {
    $document.ready(function() {
      var webEditorElement = $document[0].getElementById('web-editor');
      if (webEditorElement) {
        var codeMirrorOptions = {
          lineNumbers: true,
          mode: 'text/x-yaml',
          gutters: ['CodeMirror-lint-markers'],
          lint: true
        };
        var cm = CodeMirror.fromTextArea(webEditorElement, codeMirrorOptions);
        cm.setSize('100%', 500);
        $scope.editor = cm;
      }
    });
  }

  initView();
}]);
