angular.module(
    'portainer.kubernetes'
).component(
    'kubernetesApplicationsNodeDatatable',
    {
        templateUrl: './applicationsNodeDatatable.html',
        controller: 'GenericDatatableController',
        bindings: {
            titleText: '@',
            titleIcon: '@',
            dataset: '<',
            tableKey: '@',
            orderBy: '@',
            reverseOrder: '<',
            refreshCallback: '<'
        }
    }
);