import moment from 'moment';

angular.module('portainer.app')
  .controller('ExtensionsController', ['$scope', '$state', 'ExtensionService', 'Notifications',
    function($scope, $state, ExtensionService, Notifications) {

      $scope.state = {
        actionInProgress: false,
        currentDate: moment().format('YYYY-MM-dd')
      };

      $scope.formValues = {
        License: '',
        ExtensionFile: null,
      };

      function initView() {
        ExtensionService.extensions(true)
          .then(function onSuccess(data) {
            $scope.extensions = data;
          })
          .catch(function onError(err) {
            $scope.extensions = [];
            Notifications.error('Failure', err, 'Unable to access extension store');
          });
      }

      $scope.enableExtension = function() {
        const license = $scope.formValues.License;
        const extensionFile = $scope.formValues.ExtensionFile;

        $scope.state.actionInProgress = true;
        ExtensionService.enable(license, extensionFile)
          .then(function onSuccess() {
            return ExtensionService.retrieveAndSaveEnabledExtensions();
          }).then(function () {
            Notifications.success('Extension successfully enabled');
            $state.reload();
          })
          .catch(function onError(err) {
            Notifications.error('Failure', err, 'Unable to enable extension');
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      };


      $scope.isValidLicenseFormat = function(form) {
        var valid = true;

        if (!$scope.formValues.License) {
          return;
        }

        if (isNaN($scope.formValues.License[0])) {
          valid = false;
        }

        form.extension_license.$setValidity('invalidLicense', valid);
      };


      initView();
    }]);
