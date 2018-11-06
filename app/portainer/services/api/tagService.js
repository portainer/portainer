import { TagViewModel } from '../../models/tag';

angular.module('portainer.app')
.factory('TagService', ['$q', 'Tags', function TagServiceFactory($q, Tags) {
  'use strict';
  var service = {};

  service.tags = function() {
    var deferred = $q.defer();
    Tags.query().$promise
    .then(function success(data) {
      var tags = data.map(function (item) {
        return new TagViewModel(item);
      });
      deferred.resolve(tags);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve tags', err: err});
    });
    return deferred.promise;
  };

  service.tagNames = function() {
    var deferred = $q.defer();
    Tags.query().$promise
    .then(function success(data) {
      var tags = data.map(function (item) {
        return item.Name;
      });
      deferred.resolve(tags);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve tags', err: err});
    });
    return deferred.promise;
  };

  service.createTag = function(name) {
    var payload = {
      Name: name
    };

    return Tags.create({}, payload).$promise;
  };

  service.deleteTag = function(id) {
    return Tags.remove({id: id}).$promise;
  };

  return service;
}]);
