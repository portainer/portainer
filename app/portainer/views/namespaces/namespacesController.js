import './namespaces.css'
import _ from 'lodash';

angular.module('portainer.app').controller('NamespacesController', [
  '$scope',
  '$q',
  '$state',
  '$async',
  'ModalService',
  'NamespaceService',
  'PaginationService',
  'Notifications',
  'PAGINATION_MAX_ITEMS',
  function ($scope, $q, $state, $async, ModalService, NamespaceService, PaginationService, Notifications, PAGINATION_MAX_ITEMS) {
    $scope.state = {
      actionInProgress: false,
      pagination_count_namespaces: PaginationService.getPaginationLimit('namespaces'),
      namespaces: [],

      paginatedItemLimit: PAGINATION_MAX_ITEMS,
      orderBy: this.orderBy,
      loading: true,
      pageNumber: 1,
      filteredDataSet: [],
      totalFilteredDataset: 0,

      
    };
    $scope.namespace = {}

    $scope.changePaginationLimit = () => {
      PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
    }

    $scope.onPageChange = function (newPageNumber) {
      this.state.pageNumber = newPageNumber;
      $scope.paginationChanged();
    };

    this.paginationChanged = async function () {
      try {
        this.state.loading = true;
        this.state.filteredDataSet = [];
        const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
        const { endpoints, totalCount } = await this.retrievePage(start, this.state.paginatedItemLimit, this.state.textFilter);
        this.state.filteredDataSet = endpoints;
        this.state.totalFilteredDataSet = totalCount;
        this.refreshSelectedItems();
      } finally {
        this.state.loading = false;
      }
    };

    $scope.removeAction = removeAction;
    function removeAction(item) {
      ModalService.confirmDeletion(
        'Are you sure that you want to remove the selected ?',
        (confirmed) => {
          if (confirmed) {
            return $async(removeActionAsync, item);
          }
        }
      );
    }

    async function removeActionAsync(item) {
      try {
        await NamespaceService.deleteNamespace(item.Name).then(() => {
          Notifications.success('Namespaces successfully removed', item.Name);
          _.remove($scope.namespaces, item);
        });
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to remove namespaces');
      }
      $state.reload();
    }

    function initView() {
      NamespaceService.namespaces().then((data) => {
          $scope.state.namespaces = data.map(item => ({
            Name: item.Name,
            Containers: item.Containers ? Object.entries(item.Containers).map(([key, value]) => ({
              ContainerId: key,
              Used: value.used,
              EndpointId: value.EndpointId
            }),
            ) : {}
          }))
        })
        .catch((err) => {
          Notifications.error('Failure', err, 'Unable to retrieve namespaces');
          $scope.state.namespaces = [];
        });
    }

    initView();
  }
])
