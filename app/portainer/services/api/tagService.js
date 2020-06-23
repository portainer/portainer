import { TagViewModel } from '../../models/tag';

angular.module('portainer.app').factory('TagService', [
  '$q',
  '$async',
  'Tags',
  function TagServiceFactory($q, $async, Tags) {
    'use strict';
    var service = {};

    service.tags = function () {
      var deferred = $q.defer();
      Tags.query()
        .$promise.then(function success(data) {
          var tags = data.map(function (item) {
            return new TagViewModel(item);
          });
          deferred.resolve(tags);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve tags', err: err });
        });
      return deferred.promise;
    };

    service.tagNames = function () {
      var deferred = $q.defer();
      Tags.query()
        .$promise.then(function success(data) {
          var tags = data.map(function (item) {
            return item.Name;
          });
          deferred.resolve(tags);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve tags', err: err });
        });
      return deferred.promise;
    };

    async function createTagAsync(name) {
      var payload = {
        Name: name,
      };
      try {
        const tag = await Tags.create({}, payload).$promise;
        return new TagViewModel(tag);
      } catch (err) {
        throw { msg: 'Unable to create tag', err };
      }
    }

    function createTag(name) {
      return $async(createTagAsync, name);
    }
    service.createTag = createTag;

    service.deleteTag = function (id) {
      return Tags.remove({ id: id }).$promise;
    };

    return service;
  },
]);
