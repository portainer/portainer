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
      // TODO - utilise templates prop
      const templates = await this.HelmService.search();
      const chartCategories = Object.values(templates.entries).map((charts) => charts[0]);

      const annotationCategories = chartCategories
        .flatMap((t) => t.annotations) // get annotations
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

  $onInit() {
    return this.$async(async () => {
      this.state = {
        textFilter: '',
        selectedCategory: '',
        categories: [],
      };

      await this.updateCategories();

      const textFilter = this.DatatableService.getDataTableTextFilters(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
      }
    });
  }
}
