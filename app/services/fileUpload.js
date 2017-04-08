angular.module('portainer.services')
.factory('FileUploadService', ['$q', 'Upload', function FileUploadFactory($q, Upload) {
  'use strict';
  function uploadFile(url, file) {
    var deferred = $q.defer();
    Upload.upload({
      url: url,
      data: { file: file }
    }).then(function success(data) {
      deferred.resolve(data);
    }, function error(e) {
      deferred.reject(e);
    }, function progress(evt) {
    });
    return deferred.promise;
  }
  return {
    uploadTLSFilesForEndpoint: function(endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
      var deferred = $q.defer();
      var queue = [];

      if (TLSCAFile) {
        console.log('HDD');
        var uploadTLSCA = uploadFile('api/upload/tls/' + endpointID + '/ca', TLSCAFile);
        queue.push(uploadTLSCA);
      }
      if (TLSCertFile) {
        console.log('HDZ');
        var uploadTLSCert = uploadFile('api/upload/tls/' + endpointID + '/cert', TLSCertFile);
        queue.push(uploadTLSCert);
      }
      if (TLSKeyFile) {
        console.log('HDDS');
        var uploadTLSKey = uploadFile('api/upload/tls/' + endpointID + '/key', TLSKeyFile);
        queue.push(uploadTLSKey);
      }
      $q.all(queue).then(function (data) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      }, function update(evt) {
        deferred.notify(evt);
      });
      return deferred.promise;
    }
  };
}]);
