angular.module('portainer.services')
.factory('StackCreateService', ['$sce', '$http', '$q', 'ResourceControlService',
function StackCreateServiceFactory($sce, $http, $q, ResourceControlService) {
  'use strict';
  var service = {};

  var Name = '';
  var StackFileContent = '# Define or paste the content of your docker-compose file here';
  var StackFile = null;
  var RepositoryURL = '';
  var RepositoryPath = 'docker-compose.yml';
  var AccessControlData = new AccessControlFormData();

  service.setName = function(name) {
    Name = name;
  };

  service.setStackFileContent = function(content) {
    StackFileContent = content;
  };

  service.formValues = function() {
    return {
        Name: Name,
        StackFileContent: StackFileContent,
        StackFile: StackFile,
        RepositoryURL: RepositoryURL,
        RepositoryPath: RepositoryPath,
        AccessControlData: AccessControlData
      };
  };

  return service;
}]);
