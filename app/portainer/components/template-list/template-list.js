angular.module('portainer.app').component('templateList', {
  templateUrl: './templateList.html',
  controller: function() {
    var ctrl = this;

    this.state = {
      textFilter: '',
      selectedCategory: '',
      categories: [],
      showContainerTemplates: true
    };

    this.updateCategories = function() {
      var availableCategories = [];

      for (var i = 0; i < ctrl.templates.length; i++) {
        var template = ctrl.templates[i];
        if ((template.Type === 1 && ctrl.state.showContainerTemplates) || (template.Type === 2 && ctrl.showSwarmStacks) || (template.Type === 3 && !ctrl.showSwarmStacks)) {
          availableCategories = availableCategories.concat(template.Categories);
        }
      }

      this.state.categories = _.sortBy(_.uniq(availableCategories));
    };

    this.filterByCategory = function(item) {
      if (!ctrl.state.selectedCategory) {
        return true;
      }

      return _.includes(item.Categories, ctrl.state.selectedCategory);
    };

    this.filterByType = function(item) {
      if ((item.Type === 1 && ctrl.state.showContainerTemplates) || (item.Type === 2 && ctrl.showSwarmStacks) || (item.Type === 3 && !ctrl.showSwarmStacks)) {
        return true;
      }
      return false;
    };

    this.$onInit = function() {
      if (this.showSwarmStacks) {
        this.state.showContainerTemplates = false;
      }
      this.updateCategories();
    };
  },
  bindings: {
    titleText: '@',
    titleIcon: '@',
    templates: '<',
    selectAction: '<',
    deleteAction: '<',
    showSwarmStacks: '<',
    showAddAction: '<',
    showUpdateAction: '<',
    showDeleteAction: '<'
  }
});
