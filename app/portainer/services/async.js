angular.module('portainer').factory('$async', ['$q',
  function($q) {
    return function(asyncFunc, ...args) {
      const wrapper = function(params) {
        const deferred = $q.defer();
        asyncFunc(params)
          .then(deferred.resolve)
          .catch(deferred.reject);
        return deferred.promise;
      };
      wrapper(...args).then(() => {
        /*no op*/
      });
    };
  }
]);
