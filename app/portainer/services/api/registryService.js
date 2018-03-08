angular.module('portainer.app')
.factory('RegistryService', ['$q', 'Registries', 'RegistryBlobs', 'RegistryCatalog', 'RegistryTags', 'RegistryManifests', 'DockerHubService', 'RegistryHelper', 'ImageHelper', function RegistryServiceFactory($q, Registries, RegistryBlobs, RegistryCatalog, RegistryTags, RegistryManifests, DockerHubService, RegistryHelper, ImageHelper) {
  'use strict';
  var service = {};

  service.registries = function() {
    var deferred = $q.defer();

    Registries.query().$promise
    .then(function success(data) {
      var registries = data.map(function (item) {
        return new RegistryViewModel(item);
      });
      deferred.resolve(registries);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registries', err: err});
    });

    return deferred.promise;
  };

  service.registry = function(id) {
    var deferred = $q.defer();

    Registries.get({id: id}).$promise
    .then(function success(data) {
      var registry = new RegistryViewModel(data);
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registry details', err: err});
    });

    return deferred.promise;
  };

  service.catalog = function(id) {
    var deferred = $q.defer();

    // Init empty catalog
    var catalog = {repositories: []};

    // Function to loop over all repositories, by slices of limit
    // If we have a link header, we have more repositories to grab
    // When we don't have this header, we got all repositories
    var loopAllSlices = function loopAllSlices(id, limit, last) {
      return RegistryCatalog.get({id: id, limit: limit, last: last}).$promise.then(function success(data) {
        catalog.repositories = catalog.repositories.concat(data.data.repositories);
        if (data.headers.link) {
          // Get last and recall
          var newLast = data.headers.link.split('last=')[1].split('&')[0];
          return loopAllSlices(id, limit, newLast);
        }
      });
    };

    loopAllSlices(id, 200, '').then(function () {
      var catalogViewModel = new RegistryCatalogViewModel(catalog);
      deferred.resolve(catalogViewModel);
      return deferred.promise;
    });

    return deferred.promise;
  };

  service.tags = function(id, repository) {
    var deferred = $q.defer();

    RegistryTags.get({id: id, repository: repository}).$promise
    .then(function success(data) {
      var tags = new RegistryTagsViewModel(data);
      deferred.resolve(tags);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve repository tags', err: err});
    });

    return deferred.promise;
  };

  service.manifests = function(id, repository, tag) {
    var deferred = $q.defer();

    RegistryManifests.get({id: id, repository: repository, tag: tag}).$promise
    .then(function success(data) {
      RegistryManifests.head({id: id, repository: repository, tag: tag}).$promise
      .then(function success(headersv2) {
        var manifests = new RegistryManifestsViewModel(data.data, data.headers, headersv2.headers);
        deferred.resolve(manifests);
      })
      .catch(function error(err) {
        deferred.reject({msg: 'Unable to retrieve repository tag manifests headers', err: err});
      });
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve repository tag manifests', err: err});
    });

    return deferred.promise;
  };

  service.deleteTag = function(id, repository, tag) {
    var deferred = $q.defer();

    RegistryManifests.delete({id: id, repository: repository, tag: tag}).$promise
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to delete repository tag', err: err});
    });

    return deferred.promise;
  };


  service.blobs = function(id, repository, reference) {
    var deferred = $q.defer();

    RegistryBlobs.head({id: id, repository: repository, reference: reference}).$promise
    .then(function success(data) {
      var blobs = new RegistryBlobsViewModel(data.data, data.headers);
      deferred.resolve(blobs);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve repository blob metadata', err: err});
    });

    return deferred.promise;
  };

  service.deleteRepository = function(id, repository) {
    var deferred = $q.defer();

    // Get tags for repo
    service.tags(id, repository)
    .then(function success(tags) {
    
      // Prepare all queries to manifests
      var manifestsPromises = tags.Tags.map(function (tag) {
        return service.manifests(id, repository, tag);
      });

      // Query all manifests of all tags
      $q.all(manifestsPromises)
      .then(function(allManifests) {

        // Get digests unique list
        var digests = [];
        for (var m in allManifests) {
          if (digests.indexOf(allManifests[m].Digest) === -1) {
            digests.push(allManifests[m].Digest);
          }
        }

        // Prepare all delete promises
        var deleteDigestPromises = digests.map(function (d) {
          return service.deleteTag(id, repository, d);
        });

        // Run all delete
        $q.all(deleteDigestPromises)
        .then(function(result) {
          deferred.resolve(repository);
          console.log(result);
        });
      });

    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve repository tags', err: err});
    });

    return deferred.promise;
  };

  service.encodedCredentials = function(registry) {
    var credentials = {
      username: registry.Username,
      password: registry.Password,
      serveraddress: registry.URL
    };
    return btoa(JSON.stringify(credentials));
  };

  service.updateAccess = function(id, authorizedUserIDs, authorizedTeamIDs) {
    return Registries.updateAccess({id: id}, {authorizedUsers: authorizedUserIDs, authorizedTeams: authorizedTeamIDs}).$promise;
  };

  service.deleteRegistry = function(id) {
    return Registries.remove({id: id}).$promise;
  };

  service.updateRegistry = function(registry) {
    return Registries.update({ id: registry.Id }, registry).$promise;
  };

  service.createRegistry = function(name, URL, authentication, username, password) {
    var payload = {
      Name: name,
      URL: URL,
      Authentication: authentication
    };
    if (authentication) {
      payload.Username = username;
      payload.Password = password;
    }
    return Registries.create({}, payload).$promise;
  };

  service.retrieveRegistryFromRepository = function(repository) {
    var deferred = $q.defer();

    var imageDetails = ImageHelper.extractImageAndRegistryFromRepository(repository);
    $q.when(imageDetails.registry ? service.registries() : DockerHubService.dockerhub())
    .then(function success(data) {
      var registry = data;
      if (imageDetails.registry) {
        registry = RegistryHelper.getRegistryByURL(data, imageDetails.registry);
      }
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve the registry associated to the repository', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
