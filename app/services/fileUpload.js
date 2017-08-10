angular.module('portainer.services')
.factory('FileUploadService', ['$q', 'Upload', function FileUploadFactory($q, Upload) {
  'use strict';

  var service = {};

  function uploadFile(url, file) {
    return Upload.upload({ url: url, data: { file: file }});
  }

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
