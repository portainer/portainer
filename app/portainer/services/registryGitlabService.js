import _ from 'lodash-es';
import { RegistryGitlabProject } from '../models/gitlabRegistry';
import { RegistryRepositoryGitlabViewModel } from '../models/registryRepository';

angular.module('portainer.app').factory('RegistryGitlabService', [
  '$async',
  'Gitlab',
  function RegistryGitlabServiceFactory($async, Gitlab) {
    'use strict';
    var service = {};

    /**
     * PROJECTS
     */

    async function _getProjectsPage(env, params, projects) {
      const response = await Gitlab(env).projects(params).$promise;
      projects = _.concat(projects, response.data);
      if (response.next) {
        params.page = response.next;
        projects = await _getProjectsPage(env, params, projects);
      }
      return projects;
    }

    async function projectsAsync(url, token) {
      try {
        const data = await _getProjectsPage({ url: url, token: token }, { page: 1 }, []);
        return _.map(data, (project) => new RegistryGitlabProject(project));
      } catch (error) {
        throw { msg: 'Unable to retrieve projects', err: error };
      }
    }

    /**
     * END PROJECTS
     */

    /**
     * REPOSITORIES
     */

    async function _getRepositoriesPage(params, repositories) {
      const response = await Gitlab().repositories(params).$promise;
      repositories = _.concat(repositories, response.data);
      if (response.next) {
        params.page = response.next;
        repositories = await _getRepositoriesPage(params, repositories);
      }
      return repositories;
    }

    async function repositoriesAsync(registry, endpointId) {
      try {
        const params = {
          id: registry.Id,
          endpointId: endpointId,
          projectId: registry.Gitlab.ProjectId,
          page: 1,
        };
        const data = await _getRepositoriesPage(params, []);
        return _.map(data, (r) => new RegistryRepositoryGitlabViewModel(r));
      } catch (error) {
        throw { msg: 'Unable to retrieve repositories', err: error };
      }
    }

    /**
     * END REPOSITORIES
     */

    /**
     * SERVICE FUNCTIONS DECLARATION
     */

    function projects(url, token) {
      return $async(projectsAsync, url, token);
    }

    function repositories(registry, endpointId) {
      return $async(repositoriesAsync, registry, endpointId);
    }

    service.projects = projects;
    service.repositories = repositories;
    return service;
  },
]);
