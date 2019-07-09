import _ from 'lodash-es';
import { RepositoryShortTag } from '../models/repositoryTag';
import RegistryRepositoryViewModel from '../models/registryRepository';
import genericAsyncGenerator from './genericAsyncGenerator';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryV2Service', ['$q', '$async', 'RegistryCatalog', 'RegistryTags', 'RegistryManifestsJquery', 'RegistryV2Helper',
function RegistryV2ServiceFactory($q, $async, RegistryCatalog, RegistryTags, RegistryManifestsJquery, RegistryV2Helper) {
  'use strict';
  var service = {};

  service.ping = function(id, forceNewConfig) {
    if (forceNewConfig) {
      return RegistryCatalog.pingWithForceNew({ id: id }).$promise;
    }
    return RegistryCatalog.ping({ id: id }).$promise;
  };

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

  function getCatalog(id) {
    var deferred = $q.defer();
    var repositories = [];

    _getCatalogPage({id: id}, deferred, repositories);
    return deferred.promise;
  }

  service.catalog = function (id) {
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

    _getTagsPage({id: id, repository: repository}, deferred, {tags:[]});
    return deferred.promise;
  };

  function _getTagsPage(params, deferred, previousTags) {
    RegistryTags.get(params).$promise.then(function(data) {
      previousTags.name = data.name;
      previousTags.tags = _.concat(previousTags.tags, data.tags);
      if (data.last && data.n) {
        _getTagsPage({id: params.id, repository: params.repository, n: data.n, last: data.last}, deferred, previousTags);
      } else {
        deferred.resolve(previousTags);
      }
    }).catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve tags',
        err: err
      });
    });
  }

  service.getRepositoriesDetails = function (id, repositories) {
    var deferred = $q.defer();
    var promises = [];
    for (var i = 0; i < repositories.length; i++) {
      var repository = repositories[i].Name;
      promises.push(service.tags(id, repository));
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
      v1: RegistryManifestsJquery.get({
        id: id,
        repository: repository,
        tag: tag
      }),
      v2: RegistryManifestsJquery.getV2({
        id: id,
        repository: repository,
        tag: tag
      })
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

  service.addTag = function (id, repository, {tag, manifest}) {
    delete manifest.digest;
    return RegistryManifestsJquery.put({
      id: id,
      repository: repository,
      tag: tag
    }, manifest);
  };

  service.deleteManifest = function (id, repository, imageDigest) {
    return RegistryManifestsJquery.delete({
      id: id,
      repository: repository,
      tag: imageDigest
    });
  };

  service.shortTag = function(id, repository, tag) {
    return new Promise ((resolve, reject) => {
      RegistryManifestsJquery.getV2({id:id, repository: repository, tag: tag})
      .then((data) => resolve(new RepositoryShortTag(tag, data.config.digest, data.digest, data)))
      .catch((err) => reject(err))
    });
  };

  service.addTagsWithProgress = async function* (id, repository, tagsList, progression = 0) {
    for await (const partialResult of genericAsyncGenerator($q, tagsList, service.addTag, [id, repository])) {
      if (typeof partialResult === 'number') {
        yield progression + partialResult;
      } else {
        yield partialResult;
      }
    }
  }

  service.shortTagsWithProgress = async function* (id, repository, tagsList) {
    yield* genericAsyncGenerator($q, tagsList, service.shortTag, [id, repository]);
  }

  service.deleteManifestsWithProgress = async function* (id, repository, manifests) {
    for await (const partialResult of genericAsyncGenerator($q, manifests, service.deleteManifest, [id, repository])) {
      yield partialResult;
    }
  }

  service.retagWithProgress = async function* (id, repository, modifiedTags, modifiedDigests, impactedTags){
    yield* service.deleteManifestsWithProgress(id, repository, modifiedDigests);

    const newTags = _.map(impactedTags, (item) => {
      const tagFromTable = _.find(modifiedTags, { 'Name': item.Name });
      const name = tagFromTable && tagFromTable.Name !== tagFromTable.NewName ? tagFromTable.NewName : item.Name;
      return { tag: name, manifest: item.ManifestV2 };
    });

    yield* service.addTagsWithProgress(id, repository, newTags, modifiedDigests.length);
  }

  service.deleteTagsWithProgress = async function* (id, repository, modifiedDigests, impactedTags) {
    yield* service.deleteManifestsWithProgress(id, repository, modifiedDigests);

    const newTags = _.map(impactedTags, (item) => {return {tag: item.Name, manifest: item.ManifestV2}})

    yield* service.addTagsWithProgress(id, repository, newTags, modifiedDigests.length);
  }

  return service;
}
]);
