angular.module('portainer.services')
.factory('ProjectService', ['$cacheFactory', '$sce', '$http', '$q', 'OrcaProject', 'Project', 'OrcaStatusService', 'OperationService', 'DeploymentService', 'ResourceControlService', 'FileUploadService', 'ProjectHelper', 'ServiceService', 'SwarmService',
function ProjectServiceFactory($cacheFactory, $sce, $http, $q, OrcaProject, Project, OrcaStatusService, OperationService, DeploymentService, ResourceControlService, FileUploadService, ProjectHelper, ServiceService, SwarmService) {
  'use strict';
  var service = {};

  service.project = function(id) {
    var deferred = $q.defer();

    Project.get({ id: id }).$promise
    .then(function success(data) {
      var project = new ProjectViewModel(data);
      deferred.resolve(project);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve project details', err: err });
    });

    return deferred.promise;
  };

  service.getProjectFile = function(id) {
    var deferred = $q.defer();

    Project.getProjectFile({ id: id }).$promise
    .then(function success(data) {
      deferred.resolve(data.ProjectFileContent);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve project content', err: err });
    });

    return deferred.promise;
  };

  function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  function _trustSrc(src) {
    return $sce.trustAsResourceUrl(src);
  }

  service.getProjectImage = function(id, parentdir) {
    var key = "projectroot/" + parentdir + "/" + id + "/target/docker-compose.png?" + Date.now();
    var $httpDefaultCache = $cacheFactory.get('$http');
    $httpDefaultCache.remove(key);

    return $http({
        method: 'GET',
        url: key,
        responseType: 'arraybuffer',
        cache: $httpDefaultCache
      }).then(function(response) {
        var str = _arrayBufferToBase64(response.data);
        return str;
      }, function(response) {
        console.error('Error in getting static project image');
      });
  }

  service.render = function(id) {
    var deferred = $q.defer();

    DeploymentService.render(id)
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to render project', err: err });
    });

    return deferred.promise;
  };

  service.messageStatus = function(id) {
    var deferred = $q.defer();

    OrcaStatusService.status(id)
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Orca status messages', err: err });
    });

    return deferred.promise;
  };

  service.operationStatus = function(id) {
    var deferred = $q.defer();

    OperationService.operation(id)
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Orca operation status', err: err });
    });

    return deferred.promise;
  };

  service.externalProject = function(id) {
    var deferred = $q.defer();

    DeploymentService.deployment(id)
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve external project', err: err });
    });

    return deferred.promise;
  };

  service.externalProjects = function() {
    var deferred = $q.defer();

    DeploymentService.deployments()
    .then(function success(data) {
      var deployments = data;

      var deploymentEntries = [];
      for (var i = 0; i < deployments.length; i++) {
          var deployment = deployments[i];
          // TODO: VERIFY
          deploymentEntries.push({ Name: deployment.Name, Content: "projectroot/" + deployment.ParentDirName + "/" + deployment.Name + "/target/docker-compose.yml"});
      }

      var projects = deploymentEntries.map(function (item) {
        return new ProjectViewModel({ Name: item.Name, Content: item.Content, External: true });
      });
      deferred.resolve(projects);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve external projects', err: err });
    });

    return deferred.promise;
  };

  service.projects = function(includeExternalProjects) {
    var deferred = $q.defer();

    return $q.all({
          externalProjects: includeExternalProjects ? service.externalProjects() : []
      })
      .then(function success(data) {
        var externalProjects = data.externalProjects;
        return externalProjects;
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve projects', err: err });
    });

    return deferred.promise;
  };

  service.remove = function(project) {
    var deferred = $q.defer();

    OrcaProject.remove({ id: project.Id }).$promise
    .then(function success(data) {
      if (project.ResourceControl && project.ResourceControl.Id) {
        return ResourceControlService.deleteResourceControl(project.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove the project', err: err });
    });

    return deferred.promise;
  };

  service.createStackFromFileContent = function(name, projectFileContent) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return Project.create({ method: 'string' }, { Name: name, SwarmID: swarm.Id, ProjectFileContent: projectFileContent }).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the project', err: err });
    });

    return deferred.promise;
  };

  service.createProjectFromGitRepository = function(name, gitRepository, pathInRepository) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return Project.create({ method: 'repository' }, { Name: name, SwarmID: swarm.Id, GitRepository: gitRepository, PathInRepository: pathInRepository }).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the project', err: err });
    });

    return deferred.promise;
  };

  service.createStackFromFileUpload = function(name, projectFile) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return FileUploadService.createProject(name, swarm.Id, projectFile);
    })
    .then(function success(data) {
      deferred.resolve(data.data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the project', err: err });
    });

    return deferred.promise;
  };

  service.updateProject = function(id, projectFile) {
    return Project.update({ id: id, ProjectFileContent: projectFile }).$promise;
  };

  return service;
}]);
