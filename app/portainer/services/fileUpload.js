angular.module('portainer.app')
.factory('FileUploadService', ['$q', 'Upload', 'EndpointProvider', function FileUploadFactory($q, Upload, EndpointProvider) {
  'use strict';

  var service = {};

  function uploadFile(url, file) {
    return Upload.upload({ url: url, data: { file: file }});
  }

  service.createStack = function(stackName, swarmId, file, env) {
    var endpointID = EndpointProvider.endpointID();
    return Upload.upload({
      url: 'api/endpoints/' + endpointID + '/stacks?method=file',
      data: {
        file: file,
        Name: stackName,
        SwarmID: swarmId,
        Env: Upload.json(env)
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
