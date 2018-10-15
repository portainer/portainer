angular.module('portainer.app')
  .controller('CreateJobController', ['$scope', '$state', 'JobService', 'Authentication', 'Notifications', 'EndpointProvider', 'StateManager',
    function ($scope, $state, JobService, Authentication, Notifications, EndpointProvider, StateManager) {

      $scope.formValues = {
        Image: 'ubuntu:latest',
        JobFileContent: '',
        JobFile: null
      };

      $scope.state = {
        Method: 'editor',
        formValidationError: '',
        actionInProgress: false
      };

      function createJob(image, method) {
        var endpointId = EndpointProvider.endpointID();

        if (method === 'editor') {
          var jobFileContent = $scope.formValues.JobFileContent;
          return JobService.createJobFromFileContent(image, jobFileContent, endpointId);
        } else if (method === 'upload') {
          var jobFile = $scope.formValues.JobFile;
          return JobService.createJobFromFileUpload(image, jobFile, endpointId);
        }
      }

      $scope.executeScript = function () {
        var image = $scope.formValues.Image;
        var method = $scope.state.Method;

        if (method === 'editor' && $scope.formValues.JobFileContent === '') {
          $scope.state.formValidationError = 'Script file content must not be empty';
          return;
        }

        $scope.state.actionInProgress = true;
        createJob(image, method)
          .then(function success() {
            Notifications.success('Job successfully created');
            if ($scope.provider === 'DOCKER_STANDALONE') {
              $state.go('docker.host');
            } else if ($scope.provider === 'DOCKER_SWARM_MODE') {
              $state.go('docker.swarm');
            }
          })
          .catch(function error(err) {
            Notifications.warning('Deployment error', err.data.err);
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      };

      $scope.editorUpdate = function (cm) {
        $scope.formValues.JobFileContent = cm.getValue();
      };

      function initView() {
        if (Authentication.getUserDetails().role !== 1) {
          $state.go('docker.dashboard', {
            error: 'Not enough privileges to access this page.'
          });
        }
        $scope.provider = StateManager.getState().endpoint.mode.provider;
      }

      initView();
    }
  ]);