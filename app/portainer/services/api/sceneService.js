import { SceneModel, SceneUpdateRequest } from '../../models/scene';

angular.module('portainer.app').factory('SceneService', [
  '$q',
  'Scenes',
  function SceneService($q, Scenes) {
    'use strict';
    var service = {};

    service.createScene = function (data) {
      var payload = new SceneModel(data);
      return Scenes.create(payload).$promise;
    }

    service.deleteScene = function (id) {
      return Scenes.remove({ id: id }).$promise;
    }

    service.updateScene = function (data) {
      var payload = new SceneUpdateRequest(data);
      return Scenes.update(payload).$promise;
    }

    service.scene = function (id) {
      var deferred = $q.defer();
      Scenes.get({ id: id }).$promise.then(function success(data) {
          var scene = new SceneModel(data);
          deferred.resolve(scene);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve scenes', err: err });
        });

      return deferred.promise;
    }

    service.scenes = function () {
      return Scenes.query({}).$promise;
    }
    
    return service;
  }

]);