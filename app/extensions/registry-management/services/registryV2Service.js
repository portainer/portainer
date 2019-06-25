import _ from 'lodash-es';
import { RepositoryShortTag } from '../models/repositoryTag';
import RegistryRepositoryViewModel from '../models/registryRepository';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryV2Service', ['$q', '$async', 'RegistryCatalog', 'RegistryTags', 'RegistryManifests', 'RegistryManifestsJquery', 'RegistryV2Helper',
function RegistryV2ServiceFactory($q, $async, RegistryCatalog, RegistryTags, RegistryManifests, RegistryManifestsJquery, RegistryV2Helper) {
  'use strict';
  var service = {};

  service.ping = function(id, forceNewConfig) {
    if (forceNewConfig) {
      return RegistryCatalog.pingWithForceNew({ id: id }).$promise;
    }
    return RegistryCatalog.ping({ id: id }).$promise;
  };

  function getCatalog(id) {
    var deferred = $q.defer();
    var repositories = [];

    _getCatalogPage({id: id}, deferred, repositories);

    return deferred.promise;
  }

  function _getCatalogPage(params, deferred, repositories) {
    RegistryCatalog.get(params).$promise.then(function(data) {
      repositories = _.concat(repositories, data.repositories);
      if (data.last && data.n) {
        _getCatalogPage({id: params.id, n: data.n, last: data.last}, deferred, repositories);
      } else {
        deferred.resolve(repositories);
      }
    });
  }

  service.getRepositoriesDetails = function (id, repositories) {
    var deferred = $q.defer();
    var promises = [];
    for (var i = 0; i < repositories.length; i++) {
      var repository = repositories[i].Name;
      promises.push(RegistryTags.get({
        id: id,
        repository: repository
      }).$promise);
    }

    $q.all(promises)
    .then(function success(data) {
      var repositories = data.map(function (item) {
        if (!item.tags) {
          return;
        }
        return new RegistryRepositoryViewModel(item);
      });
      repositories = _.without(repositories, undefined);
      deferred.resolve(repositories);
    })
    .catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve repositories',
        err: err
      });
    });

    return deferred.promise;
  };

  service.repositories = function (id) {
    var deferred = $q.defer();

    getCatalog(id).then(function success(data) {
      var repositories = data.map(function (repositoryName) {
        return new RegistryRepositoryViewModel(repositoryName);
      });
      deferred.resolve(repositories);
    })
    .catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve repositories',
        err: err
      });
    });

    return deferred.promise;
  };

  service.tags = function (id, repository) {
    var deferred = $q.defer();
    var tags = [];

    _getTagsPage({id: id, repository: repository}, deferred, tags);

    return deferred.promise;
  };

  function _getTagsPage(params, deferred, tags) {
    RegistryTags.get(params).$promise.then(function(data) {
      tags = _.concat(tags, data.tags);
      if (data.last && data.n) {
        _getTagsPage({id: params.id, n: data.n, last: data.last}, deferred, tags);
      } else {
        deferred.resolve(tags);
      }
    }).catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve tags',
        err: err
      });
    });
  }

  service.getTagsDetails = function (id, repository, tags) {
    var promises = [];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i].Name;
      promises.push(service.tag(id, repository, tag));
    }

    return $q.all(promises);
  };

  service.tag = function (id, repository, tag) {
    var deferred = $q.defer();

    var promises = {
      v1: RegistryManifests.get({
        id: id,
        repository: repository,
        tag: tag
      }).$promise,
      v2: RegistryManifests.getV2({
        id: id,
        repository: repository,
        tag: tag
      }).$promise
    };
    $q.all(promises)
    .then(function success(data) {
      var tag = RegistryV2Helper.manifestsToTag(data);
      deferred.resolve(tag);
    }).catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve tag ' + tag,
        err: err
      });
    });

    return deferred.promise;
  };

  service.addTag = function (id, repository, tag, manifest) {
    delete manifest.digest;
    return RegistryManifests.put({
      id: id,
      repository: repository,
      tag: tag
    }, manifest).$promise;
  };

  service.deleteManifest = function (id, repository, imageDigest) {
    return RegistryManifests.delete({
      id: id,
      repository: repository,
      tag: imageDigest
    }).$promise;
  };

  service.shortTag = function(id, repository, tag) {
    return new Promise ((resolve, reject) => {
      RegistryManifestsJquery.get({id:id, repository: repository, tag: tag})
      .then((data) => resolve(new RepositoryShortTag(tag, data.config.digest, data)))
      .catch((err) => reject(err))
    });
  };

  service.shortTagsWithProgression = async function* (id, repository, tagsList) {
    const step = 100;
    let start = 0;
    let end = start + step;
    let results = [];
    while (start < tagsList.length) {
      const tags = _.slice(tagsList, start, end);
      const promises = [];
      for (let i = 0; i < tags.length; i++) {
        promises.push(service.shortTag(id, repository, tags[i]));
      }
      yield start;
      const res = await $q.all(promises);
      for (let i = 0; i < res.length; i++) {
        results.push(res[i]);
      }
      start = end;
      end = start + step;
    }
    yield tagsList.length;
    yield _.sortBy(results, 'Name');
  }

  return service;
}
]);
