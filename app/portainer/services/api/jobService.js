angular.module('portainer.app')
  .factory('JobService', ['Job', 'FileUploadService',
    function JobServiceFactory(Job, FileUploadService) {
      'use strict';
      var service = {};

      service.createJobFromFileUpload = function (image, jobFile, endpointId) {
        return FileUploadService.createHostJob(image, jobFile, endpointId);
      };

      service.createJobFromFileContent = function (image, jobFileContent, endpointId) {
        var payload = {
          image: image,
          fileContent: jobFileContent
        };
        return Job.create({
          method: 'string',
          endpointId: endpointId
        }, payload).$promise;
      };

      return service;
    }
  ]);