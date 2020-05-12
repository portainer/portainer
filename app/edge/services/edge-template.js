import angular from 'angular';

class EdgeTemplateService {
  /* @ngInject */
  constructor(EdgeTemplates) {
    this.EdgeTemplates = EdgeTemplates;
  }

  edgeTemplates() {
    return this.EdgeTemplates.query().$promise;
  }

  async edgeTemplate(template) {
    const response = await fetch(template.stackFile);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.text();
  }
}

angular.module('portainer.edge').service('EdgeTemplateService', EdgeTemplateService);
