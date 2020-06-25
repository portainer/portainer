import _ from 'lodash-es';

angular.module('portainer.app').controller('TemplateListController', TemplateListController);

function TemplateListController($async, $state, DatatableService, Notifications, TemplateService) {
  var ctrl = this;

  this.state = {
    textFilter: '',
    selectedCategory: '',
    categories: [],
    showContainerTemplates: true,
  };

  this.onTextFilterChange = function () {
    DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
  };

  this.updateCategories = function () {
    var availableCategories = [];

    for (var i = 0; i < ctrl.templates.length; i++) {
      var template = ctrl.templates[i];
      if ((template.Type === 1 && ctrl.state.showContainerTemplates) || (template.Type === 2 && ctrl.showSwarmStacks) || (template.Type === 3 && !ctrl.showSwarmStacks)) {
        availableCategories = availableCategories.concat(template.Categories);
      }
    }

    this.state.categories = _.sortBy(_.uniq(availableCategories));
  };

  this.filterByCategory = function (item) {
    if (!ctrl.state.selectedCategory) {
      return true;
    }

    return _.includes(item.Categories, ctrl.state.selectedCategory);
  };

  this.filterByType = function (item) {
    if ((item.Type === 1 && ctrl.state.showContainerTemplates) || (item.Type === 2 && ctrl.showSwarmStacks) || (item.Type === 3 && !ctrl.showSwarmStacks)) {
      return true;
    }
    return false;
  };

  this.duplicateTemplate = duplicateTemplate.bind(this);
  this.duplicateTemplateAsync = duplicateTemplateAsync.bind(this);
  function duplicateTemplate(template) {
    return $async(this.duplicateTemplateAsync, template);
  }

  async function duplicateTemplateAsync(template) {
    try {
      const { FileContent: fileContent } = await TemplateService.templateFile(template.Repository.url, template.Repository.stackfile);
      let type = 0;
      if (template.Type === 2) {
        type = 1;
      }
      if (template.Type === 3) {
        type = 2;
      }
      $state.go('portainer.templates.custom.new', { fileContent, type });
    } catch (err) {
      Notifications.error('Failure', err, 'Failed to duplicate template');
    }
  }

  this.$onInit = function () {
    if (this.showSwarmStacks) {
      this.state.showContainerTemplates = false;
    }
    this.updateCategories();

    var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
    }
  };
}
