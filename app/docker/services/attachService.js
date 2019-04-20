angular.module('portainer.docker')
.factory('AttachService', ['$q', '$timeout', 'Container', function AttachServiceFactory($q, $timeout, Container) {
    'use strict';
    var service = {};

    service.resizeTTY = function(execId, height, width, timeout) {
        var deferred = $q.defer();

        $timeout(function() {
            Container.resize({}, { id: execId, height: height, width: width }).$promise
                .then(function success(data) {
                    if (data.message) {
                        deferred.reject({ msg: 'Unable to attach to container', err: data.message });
                    } else {
                        deferred.resolve(data);
                    }
                })
                .catch(function error(err) {
                    deferred.reject({ msg: 'Unable to attach to container', err: err });
                });
        }, timeout);

        return deferred.promise;
    };

    return service;
}]);
