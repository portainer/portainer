import _ from 'lodash-es';

angular.module('portainer.app').controller('HelmListController', HelmListController);

function HelmListController(DatatableService, $timeout) {
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
      if (template.app.annotations) {
        availableCategories = availableCategories.concat(template.app.annotations.category);
      }
    }
    this.state.categories = _.sortBy(_.uniq(availableCategories));
  };

  this.filterByCategory = function (item) {
    if (!ctrl.state.selectedCategory) {
      return true;
    }

    if (item.app.annotations) {
      return _.includes(item.app.annotations.category, ctrl.state.selectedCategory);
    }
  };

  this.$onInit = function () {
    var that = this;
    $timeout(function () {
      that.updateCategories();
    }, 5000);

    var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
    }
  };
}
