export const accessViewerDatatable = {
  templateUrl: './access-viewer-datatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    dataset: '<',
  },
};
