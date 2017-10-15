angular.module('createStack', [])
.controller('CreateStackController', ['$scope', '$state', '$document', 'StackService', 'CodeMirrorService', 'Authentication', 'Notifications', 'FormValidator', 'ResourceControlService',
function ($scope, $state, $document, StackService, CodeMirrorService, Authentication, Notifications, FormValidator, ResourceControlService) {

  // Store the editor content when switching builder methods
  var editorContent = '';
  var editorEnabled = true;

  $scope.formValues = {
    Name: '',
    StackFileContent: '# Define or paste the content of your docker-compose file here',
    StackFile: null,
    RepositoryURL: '',
    RepositoryPath: 'docker-compose.yml',
    AccessControlData: new AccessControlFormData()
  };

  $scope.state = {
    Method: 'editor',
    formValidationError: ''
  };

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  function createStack(name) {
    var method = $scope.state.Method;

    if (method === 'editor') {
      // The codemirror editor does not work with ng-model so we need to retrieve
      // the value directly from the editor.
      var stackFileContent = $scope.editor.getValue();

      return StackService.createStackFromFileContent(name, stackFileContent);
    } else if (method === 'upload') {
      var stackFile = $scope.formValues.StackFile;
      return StackService.createStackFromFileUpload(name, stackFile);
    } else if (method === 'repository') {
      var gitRepository = $scope.formValues.RepositoryURL;
      var pathInRepository = $scope.formValues.RepositoryPath;
      return StackService.createStackFromGitRepository(name, gitRepository, pathInRepository);
    }
  }

  $scope.deployStack = function () {
    $('#createResourceSpinner').show();

    var name = $scope.formValues.Name;

    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true : false;
    var userId = userDetails.ID;

    if (!validateForm(accessControlData, isAdmin)) {
      $('#createResourceSpinner').hide();
      return;
    }

    createStack(name)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
    })
    .catch(function error(err) {
      Notifications.warning('Deployment error', err.err.data.err);
    })
    .then(function success(data) {
      return ResourceControlService.applyResourceControl('stack', name, userId, accessControlData, []);
    })
    .then(function success() {
      $state.go('stacks');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to apply resource control on the stack');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

  function enableEditor(value) {
    $document.ready(function() {
      var webEditorElement = $document[0].getElementById('web-editor');
      if (webEditorElement) {
        $scope.editor = CodeMirrorService.applyCodeMirrorOnElement(webEditorElement);
        if (value) {
          $scope.editor.setValue(value);
        }
      }
    });
  }

  $scope.toggleEditor = function() {
    if (!editorEnabled) {
      enableEditor(editorContent);
      editorEnabled = true;
    }
  };

  $scope.saveEditorContent = function() {
    editorContent = $scope.editor.getValue();
    editorEnabled = false;
  };

  function initView() {
    enableEditor();
  }

  initView();
}]);
