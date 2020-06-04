angular.module('portainer.docker').factory('ExecService', [
  '$q',
  '$timeout',
  'Exec',
  function ExecServiceFactory($q, $timeout, Exec) {
    'use strict';
    var service = {};

    service.resizeTTY = function (execId, width, height, timeout) {
      var deferred = $q.defer();

      $timeout(function () {
        Exec.resize({}, { id: execId, height: height, width: width })
          .$promise.then(function success(data) {
            if (data.message) {
              deferred.reject({ msg: 'Unable to resize tty of exec', err: data.message });
            } else {
              deferred.resolve(data);
            }
          })
          .catch(function error(err) {
            deferred.reject({ msg: 'Unable to resize tty of exec', err: err });
          });
      }, timeout);

      return deferred.promise;
    };

    return service;
  },
]);
