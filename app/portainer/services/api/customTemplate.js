import angular from 'angular';

angular.module('portainer.app').factory('CustomTemplateService', CustomTemplateServiceFactory);

/* @ngInject */
function CustomTemplateServiceFactory(CustomTemplates, FileUploadService) {
  var service = {};

  service.customTemplate = function customTemplate(id) {
    return CustomTemplates.get({ id }).$promise;
  };

  service.customTemplates = function customTemplates() {
    return CustomTemplates.query({}).$promise;
  };

  service.remove = function remove(id) {
    return CustomTemplates.remove({ id }).$promise;
  };

  service.customTemplateFile = async function customTemplateFile(id) {
    try {
      const { FileContent } = await CustomTemplates.file({ id }).$promise;
      return FileContent;
    } catch (err) {
      throw { msg: 'Unable to retrieve customTemplate content', err };
    }
  };

  service.updateCustomTemplate = async function updateCustomTemplate(id, customTemplate) {
    return CustomTemplates.update({ id }, customTemplate);
  };

  service.createCustomTemplateFromFileContent = async function createCustomTemplateFromFileContent(title, fileContent) {
    var payload = {
      Title: title,
      FileContent: fileContent,
    };
    try {
      return await CustomTemplates.create({ method: 'string' }, payload).$promise;
    } catch (err) {
      throw { msg: 'Unable to create the customTemplate', err };
    }
  };

  service.createCustomTemplateFromFileUpload = async function createCustomTemplateFromFileUpload(title, customTemplateFile) {
    try {
      return await FileUploadService.createCustomTemplate(title, customTemplateFile);
    } catch (err) {
      throw { msg: 'Unable to create the customTemplate', err };
    }
  };

  service.createCustomTemplateFromGitRepository = async function createCustomTemplateFromGitRepository(title, repositoryOptions) {
    var payload = {
      Title: title,
      RepositoryURL: repositoryOptions.RepositoryURL,
      RepositoryReferenceName: repositoryOptions.RepositoryReferenceName,
      ComposeFilePathInRepository: repositoryOptions.ComposeFilePathInRepository,
      RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
      RepositoryUsername: repositoryOptions.RepositoryUsername,
      RepositoryPassword: repositoryOptions.RepositoryPassword,
    };
    try {
      return await CustomTemplates.create({ method: 'repository' }, payload).$promise;
    } catch (err) {
      throw { msg: 'Unable to create the customTemplate', err };
    }
  };

  service.update = function update(customTemplate) {
    return CustomTemplates.update(customTemplate).$promise;
  };

  return service;
}
