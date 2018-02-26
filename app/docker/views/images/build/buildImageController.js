angular.module('portainer.docker')
.controller('BuildImageController', ['$scope', '$state', '$document', 'CodeMirrorService', 'BuildService', 'Notifications',
function ($scope, $state, $document, CodeMirrorService, BuildService, Notifications) {

	// Store the editor content when switching builder methods
	var editorContent = '';
	var editorEnabled = true;

	$scope.state = {
		BuildType: 'editor',
		actionInProgress: false,
		activeTab: 0
	};

	$scope.formValues = {
		ImageNames: [{ Name: '' }],
		UploadFile: null,
		URL: '',
		Path: 'Dockerfile'
	};

	$scope.addImageName = function() {
		$scope.formValues.ImageNames.push({ Name: '' });
	};

	$scope.removeImageName = function(index) {
		$scope.formValues.ImageNames.splice(index, 1);
	};

	function buildImageBasedOnBuildType(method, names) {
		var buildType = $scope.state.BuildType;
		var dockerfilePath = $scope.formValues.Path;

		if (buildType === 'upload') {
			var file = $scope.formValues.UploadFile;
			return BuildService.buildImageFromUpload(names, file, dockerfilePath);
		} else if (buildType === 'url') {
			var URL = $scope.formValues.URL;
			return BuildService.buildImageFromURL(names, URL, dockerfilePath);
		} else {
			// The codemirror editor does not work with ng-model so we need to retrieve
			// the value directly from the editor.
			var dockerfileContent = $scope.editor.getValue();
			return BuildService.buildImageFromDockerfileContent(names, dockerfileContent);
		}
	}

	$scope.buildImage = function() {
		$scope.state.actionInProgress = true;

		var imageNames = $scope.formValues.ImageNames.filter(function filterNull(x) {
			return x.Name;
		}).map(function getNames(x) {
			return x.Name;
		});

		var buildType = $scope.state.BuildType;
		buildImageBasedOnBuildType(buildType, imageNames)
		.then(function success(data) {
			$scope.buildLogs = data.buildLogs;
			$scope.state.activeTab = 1;
			if (data.hasError) {
				Notifications.error('An error occured during build', { msg: 'Please check build logs output' });
			} else {
				Notifications.success('Image successfully built');
			}
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to build image');
		})
		.finally(function final() {
			$scope.state.actionInProgress = false;
		});
	};

	function enableEditor(value) {
    $document.ready(function() {
      var webEditorElement = $document[0].getElementById('build-web-editor');
      if (webEditorElement) {
        $scope.editor = CodeMirrorService.applyCodeMirrorOnElement(webEditorElement, false, false);
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

	$scope.validImageNames = function() {
		for (var i = 0; i < $scope.formValues.ImageNames.length; i++) {
			var item = $scope.formValues.ImageNames[i];
			if (item.Name !== '') {
				return true;
			}
		}
		return false;
	};

  function initView() {
    enableEditor();
  }

  initView();
}]);
