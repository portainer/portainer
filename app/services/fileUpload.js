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

  // service.uploadTLSFilesForEndpoint = function(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
  //   var deferred = $q.defer();
  //   var queue = [];
  //
  //   if (TLSCAFile) {
  //     var uploadTLSCA = uploadFile('api/upload/tls/ca?folder=' + endpointID, TLSCAFile);
  //     queue.push(uploadTLSCA);
  //   }
  //   if (TLSCertFile) {
  //     var uploadTLSCert = uploadFile('api/upload/tls/cert?folder=' + endpointID, TLSCertFile);
  //     queue.push(uploadTLSCert);
  //   }
  //   if (TLSKeyFile) {
  //     var uploadTLSKey = uploadFile('api/upload/tls/key?folder=' + endpointID, TLSKeyFile);
  //     queue.push(uploadTLSKey);
  //   }
  //
  //   $q.all(queue).then(function (data) {
  //     deferred.resolve(data);
  //   }, function (err) {
  //     deferred.reject(err);
  //   }, function update(evt) {
  //     deferred.notify(evt);
  //   });
  //
  //   return deferred.promise;
  // };

  return service;

  // function uploadFile(url, file) {
  //   var deferred = $q.defer();
  //   Upload.upload({
  //     url: url,
  //     data: { file: file }
  //   }).then(function success(data) {
  //     deferred.resolve(data);
  //   }, function error(e) {
  //     deferred.reject(e);
  //   }, function progress(evt) {
  //   });
  //   return deferred.promise;
  // }
  // return {
  //   uploadTLSFilesForEndpoint: function(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
  //     var deferred = $q.defer();
  //     var queue = [];
  //
  //     if (TLSCAFile) {
  //       var uploadTLSCA = uploadFile('api/upload/tls/ca?folder=' + endpointID, TLSCAFile);
  //       queue.push(uploadTLSCA);
  //     }
  //     if (TLSCertFile) {
  //       var uploadTLSCert = uploadFile('api/upload/tls/cert?folder=' + endpointID, TLSCertFile);
  //       queue.push(uploadTLSCert);
  //     }
  //     if (TLSKeyFile) {
  //       var uploadTLSKey = uploadFile('api/upload/tls/key?folder=' + endpointID, TLSKeyFile);
  //       queue.push(uploadTLSKey);
  //     }
  //     $q.all(queue).then(function (data) {
  //       deferred.resolve(data);
  //     }, function (err) {
  //       deferred.reject(err);
  //     }, function update(evt) {
  //       deferred.notify(evt);
  //     });
  //     return deferred.promise;
  //   }
  // };
}]);
