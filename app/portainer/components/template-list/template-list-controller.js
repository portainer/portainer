import _ from 'lodash-es';

angular.module('portainer.app').controller('TemplateListController', TemplateListController);

function TemplateListController($scope, $async, $state, DatatableService, Notifications, TemplateService) {
  var ctrl = this;

  this.state = {
    textFilter: '',
    selectedCategory: '',
    categories: [],
    typeFilters: [],
    filterByType: '',
    showContainerTemplates: true,
    selectedOrderBy: '',
    orderByFields: [],
    orderDesc: false,
  };

  this.onTextFilterChange = function () {
    DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
  };

  ctrl.filterByTemplateType = function (item) {
    switch (item.Type) {
      case 1: // container
        return ctrl.state.showContainerTemplates;
      case 2: // swarm stack
        return ctrl.showSwarmStacks && !ctrl.state.showContainerTemplates;
      case 3: // docker compose
        return !ctrl.state.showContainerTemplates || '' === ctrl.state.filterByType || undefined === ctrl.state.filterByType;
      case 4: // Edge stack templates
        return false;
    }
    return false;
  };

  ctrl.updateCategories = function () {
    var availableCategories = [];

    for (var i = 0; i < ctrl.templates.length; i++) {
      var template = ctrl.templates[i];
      if (ctrl.filterByTemplateType(template)) {
        availableCategories = availableCategories.concat(template.Categories);
      }
    }

    ctrl.state.categories = _.sortBy(_.uniq(availableCategories));
  };

  ctrl.filterByCategory = function (item) {
    if (!ctrl.state.selectedCategory) {
      return true;
    }

    return _.includes(item.Categories, ctrl.state.selectedCategory);
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
      $state.go('docker.templates.custom.new', { fileContent, type });
    } catch (err) {
      Notifications.error('Failure', err, 'Failed to duplicate template');
    }
  }

  const categorySorter = function (template) {
    if (template.Categories && template.Categories.length > 0 && template.Categories[0] && template.Categories[0].length > 0) {
      return template.Categories[0].toLowerCase();
    }
  };

  const getSorter = function (orderBy) {
    let sorter;
    switch (orderBy) {
      case 'Categories':
        sorter = categorySorter;
        break;
      default:
        sorter = orderBy;
    }

    return sorter;
  };

  ctrl.changeOrderBy = function (orderField) {
    if (undefined === orderField) {
      ctrl.state.selectedOrderBy = '';
      ctrl.templates = ctrl.initalTemplates;
    }

    ctrl.state.selectedOrderBy = orderField;
    ctrl.templates = _.orderBy(ctrl.templates, [getSorter(ctrl.state.selectedOrderBy)], [ctrl.state.orderDesc ? 'desc' : 'asc']);
    $scope.$apply();
  };

  ctrl.applyTypeFilter = function (type) {
    ctrl.state.filterByType = type;
    ctrl.state.showContainerTemplates = 'Container' === type || '' === type || undefined === type;
    ctrl.updateCategories();
    $scope.$apply();
  };

  ctrl.invertOrder = function () {
    ctrl.state.orderDesc = !ctrl.state.orderDesc;
    ctrl.templates = _.orderBy(ctrl.templates, [getSorter(ctrl.state.selectedOrderBy)], [ctrl.state.orderDesc ? 'desc' : 'asc']);
    $scope.$apply();
  };

  ctrl.applyCategoriesFilter = function (category) {
    ctrl.state.selectedCategory = category;
    ctrl.updateCategories();
    $scope.$apply();
  };

  this.$onInit = function () {
    if (this.showSwarmStacks) {
      this.state.showContainerTemplates = false;
    }
    this.updateCategories();

    var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
    }

    this.initalTemplates = this.templates;
    this.state.orderByFields = ['Title', 'Categories', 'Description'];
    this.state.typeFilters = ['Container', 'Stack'];
  };
}
