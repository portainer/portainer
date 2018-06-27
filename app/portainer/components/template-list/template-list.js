angular.module('portainer.app').component('templateList', {
  templateUrl: 'app/portainer/components/template-list/templateList.html',
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
        if ((template.Type === 'stack' && ctrl.showStacks) || (template.Type === 'container' && ctrl.state.showContainerTemplates)) {
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

    this.$onInit = function() {
      if (this.showStacks) {
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
    showStacks: '<',
    showAddAction: '<',
    showUpdateAction: '<',
    showDeleteAction: '<'
  }
});
