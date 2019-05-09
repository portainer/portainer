import { jsonObjectsToArrayHandler, genericHandler } from '../../docker/rest/response/handlers';

angular.module('portainer.app')
.factory('FileUploadService', ['$q', 'Upload', 'EndpointProvider', function FileUploadFactory($q, Upload, EndpointProvider) {
  'use strict';

  var service = {};

  function uploadFile(url, file) {
    return Upload.upload({ url: url, data: { file: file }});
  }

  service.buildImage = function(names, file, path) {
    var endpointID = EndpointProvider.endpointID();
    return Upload.http({
      url: 'api/endpoints/' + endpointID + '/docker/build',
      headers : {
        'Content-Type': file.type
      },
      data: file,
      params: {
        t: names,
        dockerfile: path
      },
      ignoreLoadingBar: true,
      transformResponse: function(data) {
        return jsonObjectsToArrayHandler(data);
      }
    });
  };

  service.loadImages = function(file) {
    var endpointID = EndpointProvider.endpointID();
    return Upload.http({
      url: 'api/endpoints/' + endpointID + '/docker/images/load',
      headers : {
        'Content-Type': file.type
      },
      data: file,
      ignoreLoadingBar: true,
      transformResponse: genericHandler
    });
  };

  service.createSchedule = function(payload) {
    return Upload.upload({
      url: 'api/schedules?method=file',
      data: {
        file: payload.File,
        Name: payload.Name,
        CronExpression: payload.CronExpression,
        Image: payload.Image,
        Endpoints: Upload.json(payload.Endpoints),
        RetryCount: payload.RetryCount,
        RetryInterval: payload.RetryInterval
      }
    });
  };

  service.createSwarmStack = function(stackName, swarmId, file, env, endpointId) {
    return Upload.upload({
      url: 'api/stacks?method=file&type=1&endpointId=' + endpointId,
      data: {
        file: file,
        Name: stackName,
        SwarmID: swarmId,
        Env: Upload.json(env)
      },
      ignoreLoadingBar: true
    });
  };

  service.createComposeStack = function(stackName, file, env, endpointId) {
    return Upload.upload({
      url: 'api/stacks?method=file&type=2&endpointId=' + endpointId,
      data: {
        file: file,
        Name: stackName,
        Env: Upload.json(env)
      },
      ignoreLoadingBar: true
    });
  };

  service.configureRegistry = function(registryId, registryManagementConfigurationModel) {
    return Upload.upload({
      url: 'api/registries/' + registryId + '/configure',
      data: registryManagementConfigurationModel
    });
  };

  service.executeEndpointJob = function (imageName, file, endpointId, nodeName) {
    return Upload.upload({
      url: 'api/endpoints/' + endpointId + '/job?method=file&nodeName=' + nodeName,
      data: {
        File: file,
        Image: imageName
      },
      ignoreLoadingBar: true
    });
  };

  service.createEndpoint = function(name, type, URL, PublicURL, groupID, tags, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile) {
    return Upload.upload({
      url: 'api/endpoints',
      data: {
        Name: name,
        EndpointType: type,
        URL: URL,
        PublicURL: PublicURL,
        GroupID: groupID,
        Tags: Upload.json(tags),
        TLS: TLS,
        TLSSkipVerify: TLSSkipVerify,
        TLSSkipClientVerify: TLSSkipClientVerify,
        TLSCACertFile: TLSCAFile,
        TLSCertFile: TLSCertFile,
        TLSKeyFile: TLSKeyFile
      },
      ignoreLoadingBar: true
    });
  };

  service.createAzureEndpoint = function(name, applicationId, tenantId, authenticationKey, groupId, tags) {
    return Upload.upload({
      url: 'api/endpoints',
      data: {
        Name: name,
        EndpointType: 3,
        GroupID: groupId,
        Tags: Upload.json(tags),
        AzureApplicationID: applicationId,
        AzureTenantID: tenantId,
        AzureAuthenticationKey: authenticationKey
      },
      ignoreLoadingBar: true
    });
  };

  service.uploadLDAPTLSFiles = function(TLSCAFile, TLSCertFile, TLSKeyFile) {
    var queue = [];

    if (TLSCAFile) {
      queue.push(uploadFile('api/upload/tls/ca?folder=ldap', TLSCAFile));
    }
    if (TLSCertFile) {
      queue.push(uploadFile('api/upload/tls/cert?folder=ldap', TLSCertFile));
    }
    if (TLSKeyFile) {
      queue.push(uploadFile('api/upload/tls/key?folder=ldap', TLSKeyFile));
    }

    return $q.all(queue);
  };

  service.uploadTLSFilesForEndpoint = function(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
    var queue = [];

    if (TLSCAFile) {
      queue.push(uploadFile('api/upload/tls/ca?folder=' + endpointID, TLSCAFile));
    }
    if (TLSCertFile) {
      queue.push(uploadFile('api/upload/tls/cert?folder=' + endpointID, TLSCertFile));
    }
    if (TLSKeyFile) {
      queue.push(uploadFile('api/upload/tls/key?folder=' + endpointID, TLSKeyFile));
    }

    return $q.all(queue);
  };

  return service;
}]);
