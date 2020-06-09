import { LocationViewModel } from '../models/location';

angular.module('portainer.azure').factory('LocationService', [
  '$q',
  'Location',
  function LocationServiceFactory($q, Location) {
    'use strict';
    var service = {};

    service.locations = function (subscriptionId) {
      var deferred = $q.defer();

      Location.query({ subscriptionId: subscriptionId })
        .$promise.then(function success(data) {
          var locations = data.value.map(function (item) {
            return new LocationViewModel(item);
          });
          deferred.resolve(locations);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve locations', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
