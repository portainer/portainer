export default class HelmTemplatesListController {
  /* @ngInject */
  constructor($async, $scope, DatatableService, HelmService, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.DatatableService = DatatableService;
    this.HelmService = HelmService;
    this.Notifications = Notifications;

    this.state = {
      textFilter: '',
      selectedCategory: '',
      categories: [],
    };

    this.updateCategories = this.updateCategories.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
  }

  async updateCategories() {
    try {
      const annotationCategories = this.charts
        .map((t) => t.annotations) // get annotations
        .filter((a) => a) // filter out undefined/nulls
        .map((c) => c.category); // get annotation category
      const availableCategories = [...new Set(annotationCategories)].sort(); // unique and sort
      this.state.categories = availableCategories.map((cat) => ({ label: cat, value: cat }));
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm charts categories');
    }
  }

  onCategoryChange(value) {
    return this.$scope.$evalAsync(() => {
      this.state.selectedCategory = value || '';
    });
  }

  onTextFilterChange() {
    this.DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
  }

  $onChanges() {
    if (this.charts.length > 0) {
      this.updateCategories();
    }
  }

  $onInit() {
    return this.$async(async () => {
      const textFilter = this.DatatableService.getDataTableTextFilters(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
      }
    });
  }
}
