angular.module('portainer.services')
.factory('ProjectService', ['$q', 'Project', 'DeploymentService', 'ResourceControlService', 'FileUploadService', 'ProjectHelper', 'ServiceService', 'SwarmService',
function ProjectServiceFactory($q, Project, DeploymentService, ResourceControlService, FileUploadService, ProjectHelper, ServiceService, SwarmService) {
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

  service.externalProjects = function() {
    var deferred = $q.defer();

    DeploymentService.deployments()
    .then(function success(data) {

      console.log("Data: " + data)


      var deployments = data;
      //var projectNames = ProjectHelper.getExternalProjectNamesFromOrca();

      var deploymentNames = [];
      for (var i = 0; i < deployments.length; i++) {
          var deployment = deployments[i];

          console.log("Deployment ID: " + deployment.Id)

          // TODO: VERIFY
          deploymentNames.push(deployment.Name);
      }

      var projects = deploymentNames.map(function (item) {
        return new ProjectViewModel({ Name: item, External: true });
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

    console.log("Fetching projects...includeExternalProjects: " + includeExternalProjects)

    /*
    Container.query({ all : all, filters: filters }).$promise
    .then(function success(data) {
      var containers = data.map(function (item) {
        return new ContainerViewModel(item);
      });
      deferred.resolve(containers);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve containers', err: err });
    });
    */

    //SwarmService.swarm()
    //.then(function success(data) {
    //  var swarm = data;

      return $q.all({
      //{ swarmId: swarm.Id }
      //  projects: Project.query().$promise,
        externalProjects: includeExternalProjects ? service.externalProjects() : []
     // });
    })
    .then(function success(data) {

      //console.log("Mapping project data...")

      //var projects = data.projects.map(function (item) {
      //  item.External = false;
      //  return new ProjectViewModel(item);
      //});

      console.log("Getting external projects...")

      var externalProjects = data.externalProjects;

      console.log("Found: " + externalProjects)

      //var result = _.unionWith(projects, externalProjects, function(a, b) { return a.Name === b.Name; });
      //deferred.resolve(result);

      //deferred.resolve(externalProjects);
      return externalProjects;
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve projects', err: err });
    });

    console.log("Here at end of function")

    return deferred.promise;
  };

  service.remove = function(stack) {
    var deferred = $q.defer();

    Project.remove({ id: project.Id }).$promise
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
