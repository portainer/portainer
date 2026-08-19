import angular from 'angular';

angular.module('portainer.edge').factory('EdgeStackService', function EdgeStackServiceFactory(EdgeStacks, FileUploadService) {
  var service = {};

  service.stack = function stack(id) {
    return EdgeStacks.get({ id }).$promise;
  };

  service.stacks = function stacks() {
    return EdgeStacks.query({}).$promise;
  };

  service.remove = function remove(id) {
    return EdgeStacks.remove({ id }).$promise;
  };

  service.stackFile = async function stackFile(id) {
    try {
      const { StackFileContent } = await EdgeStacks.file({ id }).$promise;
      return StackFileContent;
    } catch (err) {
      throw { msg: 'Unable to retrieve stack content', err };
    }
  };

  service.updateStack = async function updateStack(id, stack) {
    return EdgeStacks.update({ id }, stack).$promise;
  };

  service.createStackFromFileContent = async function createStackFromFileContent(payload) {
    try {
      return await EdgeStacks.create({}, { method: 'string', ...payload }).$promise;
    } catch (err) {
      throw { msg: 'Unable to create the stack', err };
    }
  };

  service.createStackFromFileUpload = async function createStackFromFileUpload(payload, file) {
    try {
      return await FileUploadService.createEdgeStack(payload, file);
    } catch (err) {
      throw { msg: 'Unable to create the stack', err };
    }
  };

  service.createStackFromGitRepository = async function createStackFromGitRepository(payload, repositoryOptions) {
    try {
      return await EdgeStacks.create(
        {},
        {
          ...payload,
          method: 'repository',
          RepositoryURL: repositoryOptions.RepositoryURL,
          RepositoryReferenceName: repositoryOptions.RepositoryReferenceName,
          FilePathInRepository: repositoryOptions.FilePathInRepository,
          RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
          RepositoryUsername: repositoryOptions.RepositoryUsername,
          RepositoryPassword: repositoryOptions.RepositoryPassword,
          TLSSkipVerify: repositoryOptions.TLSSkipVerify,
        }
      ).$promise;
    } catch (err) {
      throw { msg: 'Unable to create the stack', err };
    }
  };

  return service;
});
