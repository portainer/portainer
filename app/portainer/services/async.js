angular.module('portainer').factory('$async', ['$q',
  function($q) {
    return function(asyncFunc) {
      const wrapper = function() {
        const deferred = $q.defer();
        asyncFunc()
          .then(deferred.resolve)
          .catch(deferred.reject);
        return deferred.promise;
      };
      wrapper().then(() => {
        /*no op*/
      });
    };
  }
]);
