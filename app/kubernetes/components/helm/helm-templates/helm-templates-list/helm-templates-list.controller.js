export default class HelmTemplatesListController {
  /* @ngInject */
  constructor($async, DatatableService, HelmService, Notifications) {
    this.$async = $async;
    this.DatatableService = DatatableService;
    this.HelmService = HelmService;
    this.Notifications = Notifications;

    this.updateCategories = this.updateCategories.bind(this);
  }

  async updateCategories() {
    try {
      const annotationCategories = this.charts
        .map((t) => t.annotations) // get annotations
        .filter((a) => a) // filter out undefined/nulls
        .map((c) => c.category); // get annotation category
      const availableCategories = [...new Set(annotationCategories)].sort(); // unique and sort
      this.state.categories = availableCategories;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm charts categories');
    }
  }

  onTextFilterChange() {
    this.DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
  }

  clearCategory() {
    this.state.selectedCategory = '';
  }

  $onChanges() {
    if (this.charts.length > 0) {
      this.updateCategories();
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        textFilter: '',
        selectedCategory: '',
        categories: [],
      };

      const textFilter = this.DatatableService.getDataTableTextFilters(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
      }
    });
  }
}
