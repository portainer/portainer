import { confirmWebEditorDiscard } from '@@/modals/confirm';
import { editor, upload, url } from '@@/BoxSelector/common-options/build-methods';

angular.module('portainer.docker').controller('BuildImageController', BuildImageController);

/* @ngInject */
function BuildImageController($scope, $async, $window, BuildService, Notifications, HttpRequestHelper, endpoint) {
  $scope.endpoint = endpoint;
  $scope.options = [editor, upload, url];

  $scope.state = {
    BuildType: 'editor',
    actionInProgress: false,
    activeTab: 0,
    isEditorDirty: false,
  };

  $scope.formValues = {
    ImageNames: [{ Name: '', Valid: false, Unique: true }],
    UploadFile: null,
    DockerFileContent: '',
    AdditionalFiles: [],
    URL: '',
    Path: 'Dockerfile',
    NodeName: null,
  };

  $window.onbeforeunload = () => {
    if ($scope.state.BuildType === 'editor' && $scope.formValues.DockerFileContent && $scope.state.isEditorDirty) {
      return '';
    }
  };

  $scope.$on('$destroy', function () {
    $scope.state.isEditorDirty = false;
  });

  $scope.onChangeBuildType = function (type) {
    $scope.$evalAsync(() => {
      $scope.state.BuildType = type;
    });
  };

  $scope.checkName = function (index) {
    var item = $scope.formValues.ImageNames[index];
    item.Valid = true;
    item.Unique = true;
    if (item.Name !== '') {
      // Check unique
      $scope.formValues.ImageNames.forEach((element, idx) => {
        if (idx != index && element.Name == item.Name) {
          item.Valid = false;
          item.Unique = false;
        }
      });
      if (!item.Valid) {
        return;
      }
    }
    // Validation
    const parts = item.Name.split('/');
    const repository = parts[parts.length - 1];
    const repositoryRegExp = RegExp('^[a-z0-9-_.]{2,255}(:[A-Za-z0-9-_.]{1,128})?$');
    item.Valid = repositoryRegExp.test(repository);
  };

  $scope.addImageName = function () {
    $scope.formValues.ImageNames.push({ Name: '', Valid: false, Unique: true });
  };

  $scope.removeImageName = function (index) {
    $scope.formValues.ImageNames.splice(index, 1);
    for (var i = 0; i < $scope.formValues.ImageNames.length; i++) {
      $scope.checkName(i);
    }
  };

  function buildImageBasedOnBuildType(method, names) {
    var buildType = $scope.state.BuildType;
    var dockerfilePath = $scope.formValues.Path;

    if (buildType === 'upload') {
      var file = $scope.formValues.UploadFile;
      return BuildService.buildImageFromUpload(endpoint.Id, names, file, dockerfilePath);
    } else if (buildType === 'url') {
      var URL = $scope.formValues.URL;
      return BuildService.buildImageFromURL(endpoint.Id, names, URL, dockerfilePath);
    } else {
      var dockerfileContent = $scope.formValues.DockerFileContent;
      if ($scope.formValues.AdditionalFiles.length === 0) {
        return BuildService.buildImageFromDockerfileContent(endpoint.Id, names, dockerfileContent);
      } else {
        var additionalFiles = $scope.formValues.AdditionalFiles;
        return BuildService.buildImageFromDockerfileContentAndFiles(endpoint.Id, names, dockerfileContent, additionalFiles);
      }
    }
  }

  $scope.buildImage = buildImage;

  async function buildImage() {
    return $async(async () => {
      var buildType = $scope.state.BuildType;

      if (buildType === 'editor' && $scope.formValues.DockerFileContent === '') {
        $scope.state.formValidationError = 'Dockerfile content must not be empty';
        return;
      }

      $scope.state.actionInProgress = true;

      var imageNames = $scope.formValues.ImageNames.filter(function filterNull(x) {
        return x.Name;
      }).map(function getNames(x) {
        return x.Name;
      });

      var nodeName = $scope.formValues.NodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

      try {
        const data = await buildImageBasedOnBuildType(buildType, imageNames);
        $scope.buildLogs = data.buildLogs;
        $scope.state.activeTab = 1;
        if (data.hasError) {
          Notifications.error('An error occurred during build', { msg: 'Please check build logs output' });
        } else {
          Notifications.success('Image successfully built');
          $scope.state.isEditorDirty = false;
        }
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to build image');
      } finally {
        $scope.state.actionInProgress = false;
      }
    });
  }

  $scope.validImageNames = function () {
    if ($scope.formValues.ImageNames.length == 0) {
      return false;
    }
    for (var i = 0; i < $scope.formValues.ImageNames.length; i++) {
      if (!$scope.formValues.ImageNames[i].Valid) {
        return false;
      }
    }
    return true;
  };

  $scope.editorUpdate = function (value) {
    $scope.formValues.DockerFileContent = value;
    $scope.state.isEditorDirty = true;
  };

  this.uiCanExit = async function () {
    if ($scope.state.BuildType === 'editor' && $scope.formValues.DockerFileContent && $scope.state.isEditorDirty) {
      return confirmWebEditorDiscard();
    }
  };

  $scope.selectAdditionalFiles = function (files) {
    $scope.formValues.AdditionalFiles = files;
  };
}
