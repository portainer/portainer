import _ from 'lodash-es';
import { RegistryGitlabProject } from 'Portainer/models/registry';

angular.module('portainer.extensions.registrymanagement')
.factory('GitlabService', ['$q', 'Gitlab',
function GitlabServiceFactory($q, Gitlab) {
  'use strict';
  var service = {};

  function getProjects(url, token) {
    const deferred = $q.defer();

    const projects = [];
    _getProjectsPage({url: url, token: token}, {page: 1}, deferred, projects);

    return deferred.promise;
  }

  function _getProjectsPage(env, params, deferred, projects) {
    Gitlab(env).listProjects(params).$promise
    .then((response) => {
      projects = _.concat(projects, response.data);
      if (response.next) {
        params.page = response.next;
        _getProjectsPage(env, params, deferred, projects);
      } else {
        deferred.resolve(projects);
      }
    }).catch((err) => {
      deferred.reject(err);
    });
  }

  service.projects = function (url, token) {
    const deferred = $q.defer();

    getProjects(url, token)
    .then((data) => {
      const projects = _.map(data, (project) => new RegistryGitlabProject(project));
      deferred.resolve(projects);
    })
    .catch(function error(err) {
      deferred.reject({
        msg: 'Unable to retrieve projects',
        err: err
      });
    });

    return deferred.promise;
  };

  return service;
}
]);
