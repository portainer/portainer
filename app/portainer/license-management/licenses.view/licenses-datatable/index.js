export const licensesDatatable = {
  templateUrl: './licenses-datatable.html',
  controller: 'GenericDatatableController',
  bindings: { dataset: '<', titleIcon: '@', tableKey: '@', orderBy: '@', removeAction: '<', updateAction: '<', reverseOrder: '<', copyLicenseKey: '<' },
};
